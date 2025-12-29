"use client";

import React from "react";

const MessagesHeader = ({
  total,
}) => {
  return (
    <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <div className="flex-1 flex items-center gap-2">
          <h1 className="text-lg font-semibold">Messages</h1>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">({total})</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesHeader;

