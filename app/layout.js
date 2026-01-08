import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { configurationService } from "@/services/configuration";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata() {
  let description = "Melode Management Platform";
  
  try {
    const response = await configurationService.getOrganisation();
    const data = response.data;
    
    // Handle paginated response structure: { organizations: [...], total, page, ... }
    const organisation = data?.organizations?.[0] || data;
    
    if (organisation?.organization_name || organisation?.organisation_name) {
      const orgName = organisation.organization_name || organisation.organisation_name;
      description = `Melode : ${orgName} Management Platform`;
    }
  } catch (error) {
    // If fetching fails, use default description
    console.warn("Failed to fetch organization name for metadata:", error);
  }
  
  return {
    title: "Melode",
    description: description,
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
