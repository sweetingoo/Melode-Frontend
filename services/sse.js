/**
 * Server-Sent Events (SSE) Service
 * Handles real-time message and notification updates via SSE
 */

// Normalize baseURL - allow HTTP for localhost/127.0.0.1, force HTTPS for others
const normalizeBaseURL = (url) => {
  if (!url) return "https://melode-api-prod.onrender.com/api/v1";
  
  // Trim whitespace
  const trimmed = url.trim();
  
  // Check if it's localhost or 127.0.0.1 - allow HTTP for local development
  const isLocalhost = /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(trimmed);
  
  if (isLocalhost) {
    // For localhost, preserve the protocol (http or https) as specified
    // If no protocol specified, default to http
    if (!/^https?:\/\//i.test(trimmed)) {
      return `http://${trimmed}`;
    }
    return trimmed;
  }
  
  // For non-localhost URLs, replace http:// with https:// to ensure secure connections
  // This handles both http:// and HTTP:// cases
  const normalized = trimmed.replace(/^https?:\/\//i, "https://");
  
  return normalized;
};

class SSEService {
  constructor() {
    this.eventSource = null;
    this.abortController = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.isConnecting = false;
    this.isConnected = false;
    this.listeners = new Map();
    this.keepAliveInterval = null;
    this.lastEventId = null;
  }

  /**
   * Get the base URL for SSE endpoint
   */
  getBaseURL() {
    return normalizeBaseURL(process.env.NEXT_PUBLIC_API_BASE_URL || "https://melode-api-prod.onrender.com/api/v1");
  }

  /**
   * Get the auth token from localStorage
   */
  getAuthToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("authToken");
  }

  /**
   * Connect to SSE endpoint
   */
  connect(onEvent, onError, onConnect, onDisconnect) {
    if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
      console.log("SSE: Already connected or connecting");
      return;
    }

    const token = this.getAuthToken();
    if (!token) {
      console.warn("SSE: No auth token available");
      if (onError) onError({ type: "authentication_error", message: "No auth token" });
      return;
    }

    this.isConnecting = true;
    const baseURL = this.getBaseURL();
    const url = `${baseURL}/messages/stream`;

    try {
      // Use fetch with ReadableStream to support Authorization header
      const abortController = new AbortController();
      this.abortController = abortController;

      console.log("SSE: Connecting to:", url);
      console.log("SSE: Using token:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");

      fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        signal: abortController.signal,
      })
        .then((response) => {
          console.log("SSE: Response status:", response.status, response.statusText);
          console.log("SSE: Response headers:", Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            const errorText = response.statusText || `HTTP ${response.status}`;
            console.error("SSE: Response not OK:", response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }

          // Check if response is actually an event stream
          const contentType = response.headers.get("content-type");
          console.log("SSE: Content-Type:", contentType);
          
          if (contentType && !contentType.includes("text/event-stream")) {
            console.warn("SSE: Warning - Content-Type is not text/event-stream:", contentType);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          // Connection opened
          console.log("SSE: Connection opened");
          this.isConnecting = false;
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          if (onConnect) onConnect();

          // Store callbacks
          this.listeners.set("event", onEvent);
          this.listeners.set("error", onError);
          this.listeners.set("connect", onConnect);
          this.listeners.set("disconnect", onDisconnect);

          // Read stream
          const readStream = () => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  console.log("SSE: Stream ended");
                  this.isConnected = false;
                  if (onDisconnect) onDisconnect();
                  
                  // Attempt to reconnect
                  if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect(onEvent, onError, onConnect, onDisconnect);
                  }
                  return;
                }

                // Decode chunk and add to buffer
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                // Log raw chunks in development
                if (process.env.NODE_ENV === "development" && chunk.length < 200) {
                  console.log("SSE: Raw chunk received:", chunk);
                }

                // Process complete SSE messages
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // Keep incomplete line in buffer

                let currentEvent = { type: "message", data: null };

                for (const line of lines) {
                  if (line.trim() && process.env.NODE_ENV === "development") {
                    console.log("SSE: Processing line:", line);
                  }
                  
                  // Skip keep-alive comments (lines starting with :)
                  if (line.startsWith(":")) {
                    continue;
                  }
                  
                  if (line.startsWith("event:")) {
                    currentEvent.type = line.substring(6).trim();
                  } else if (line.startsWith("data:")) {
                    const data = line.substring(5).trim();
                    if (data) {
                      try {
                        const parsed = JSON.parse(data);
                        // Backend sends: {"type":"message:created","data":{...}}
                        if (parsed.type && parsed.data) {
                          currentEvent.type = parsed.type;
                          currentEvent.data = parsed.data;
                        } else {
                          currentEvent.data = parsed;
                        }
                      } catch (e) {
                        currentEvent.data = data;
                      }
                    }
                  } else if (line.trim() === "") {
                    // Empty line indicates end of event - process it
                    if (currentEvent.data !== null || (currentEvent.type && currentEvent.type !== "message")) {
                      // Handle event
                      console.log("SSE: Complete event parsed:", currentEvent.type, currentEvent.data);
                      
                      if (currentEvent.type && (currentEvent.type.startsWith("message:") || currentEvent.type.startsWith("notification:"))) {
                        console.log("SSE: Dispatching event:", currentEvent.type);
                        if (onEvent) {
                          onEvent({
                            type: currentEvent.type,
                            data: currentEvent.data,
                          });
                        }
                      } else if (currentEvent.type === "connection:established") {
                        console.log("SSE: Connection established event received");
                        if (onConnect) onConnect();
                      } else if (currentEvent.type === "error") {
                        console.error("SSE: Error event received:", currentEvent.data);
                        if (onEvent) {
                          onEvent({
                            type: "error",
                            data: currentEvent.data,
                          });
                        }
                        if (onError) {
                          onError(
                            typeof currentEvent.data === "object" ? currentEvent.data : { message: currentEvent.data || "Unknown error" }
                          );
                        }
                      }
                    }
                    // Reset for next event
                    currentEvent = { type: "message", data: null };
                  }
                }
                
                // Process any remaining event if buffer is empty and we have data
                // This handles cases where events don't end with a newline
                if (buffer === "" && currentEvent.data !== null && currentEvent.type && currentEvent.type !== "message") {
                  console.log("SSE: Processing final event (no trailing newline):", currentEvent.type);
                  if (currentEvent.type.startsWith("message:") || currentEvent.type.startsWith("notification:")) {
                    if (onEvent) {
                      onEvent({
                        type: currentEvent.type,
                        data: currentEvent.data,
                      });
                    }
                  }
                  currentEvent = { type: "message", data: null };
                }

                // Continue reading
                readStream();
              })
              .catch((error) => {
                if (error.name === "AbortError") {
                  console.log("SSE: Connection aborted");
                  return;
                }
                console.error("SSE: Read error:", error);
                this.isConnecting = false;
                this.isConnected = false;
                if (onError) onError({ type: "connection_error", message: error.message });
                
                // Attempt to reconnect
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                  this.scheduleReconnect(onEvent, onError, onConnect, onDisconnect);
                }
              });
          };

          readStream();
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            console.log("SSE: Connection aborted (intentional)");
            return;
          }
          console.error("SSE: Connection error:", error);
          console.error("SSE: Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
          this.isConnecting = false;
          this.isConnected = false;
          if (onError) onError({ type: "connection_error", message: error.message });
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`SSE: Will attempt reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
            this.scheduleReconnect(onEvent, onError, onConnect, onDisconnect);
          } else {
            console.error("SSE: Max reconnection attempts reached");
          }
        });

      this.eventSource = { readyState: "CONNECTING" }; // Placeholder for compatibility
    } catch (error) {
      console.error("SSE: Failed to create connection:", error);
      this.isConnecting = false;
      if (onError) onError({ type: "connection_error", message: error.message });
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect(onEvent, onError, onConnect, onDisconnect) {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`SSE: Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isConnected && !this.isConnecting) {
        console.log(`SSE: Reconnecting (attempt ${this.reconnectAttempts})...`);
        this.connect(onEvent, onError, onConnect, onDisconnect);
      }
    }, delay);
  }

  /**
   * Disconnect from SSE endpoint
   */
  disconnect() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.eventSource) {
      this.eventSource = null;
    }
    this.isConnecting = false;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.listeners.clear();

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  /**
   * Check if connected
   */
  getConnectionState() {
    if (!this.eventSource && !this.isConnected) return "disconnected";
    if (this.isConnecting) return "connecting";
    if (this.isConnected) return "connected";
    return "disconnected";
  }
}

// Export singleton instance
export const sseService = new SSEService();

// Expose SSE service to window for debugging (development only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  window.__sseService = sseService;
  console.log("SSE: Service exposed to window.__sseService for debugging");
  console.log("SSE: Try window.__sseService.getConnectionState() to check status");
}

