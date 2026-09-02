import { useState } from "react";
import {
  Chat20Regular,
  Dismiss20Regular,
  Send20Regular,
} from "@fluentui/react-icons";
import { Button, Spinner } from "@fluentui/react-components";

import { getListings } from "./api";
import { parseAssistantIntent } from "./job-assistant";
import type { Listing } from "./types";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
  listings?: Listing[];
}

const suggestions = [
  "Show remote jobs",
  "Jobs in Auckland",
  "Newest software roles",
];

export function JobAssistant({ knownListings }: { knownListings: Listing[] }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Ask me to find jobs by role, company, location, work mode, or availability.",
    },
  ]);

  async function sendMessage(value: string): Promise<void> {
    const prompt = value.trim();
    if (!prompt || loading) return;

    const intent = parseAssistantIntent(prompt, knownListings);
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: prompt },
    ]);
    setInput("");
    setLoading(true);

    try {
      const results = await getListings(intent.query);
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: `${intent.summary} I found ${results.length} ${results.length === 1 ? "job" : "jobs"}.`,
          listings: results.slice(0, 3),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "I couldn't search the local listings just now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        appearance="primary"
        className="assistant-launcher"
        icon={<Chat20Regular />}
        onClick={() => setOpen(true)}
      >
        Ask Job Finder
      </Button>
    );
  }

  return (
    <aside
      aria-label="Job Finder assistant"
      aria-modal="false"
      className="assistant-panel"
      role="dialog"
    >
      <header className="assistant-header">
        <div>
          <strong>Job Finder assistant</strong>
          <span>Local search, no AI service</span>
        </div>
        <Button
          appearance="subtle"
          aria-label="Close assistant"
          icon={<Dismiss20Regular />}
          onClick={() => setOpen(false)}
          size="small"
        />
      </header>

      <div aria-live="polite" className="assistant-messages">
        {messages.map((message) => (
          <div className={`assistant-message ${message.role}`} key={message.id}>
            <p>{message.text}</p>
            {message.listings?.map((listing) => (
              <a
                className="assistant-result"
                href={listing.sourceUrl}
                key={listing.id}
                rel="noreferrer"
                target="_blank"
              >
                <strong>{listing.title}</strong>
                <span>{listing.companyName} · {listing.location ?? "Flexible location"}</span>
              </a>
            ))}
          </div>
        ))}
        {loading && <Spinner label="Searching local jobs" size="tiny" />}
      </div>

      {messages.length === 1 && (
        <div className="assistant-suggestions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => void sendMessage(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        className="assistant-form"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(input);
        }}
      >
        <label className="sr-only" htmlFor="assistant-input">Ask about jobs</label>
        <input
          id="assistant-input"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Try “remote jobs in Auckland”"
          value={input}
        />
        <Button
          appearance="primary"
          aria-label="Send message"
          disabled={!input.trim() || loading}
          icon={<Send20Regular />}
          type="submit"
        />
      </form>
    </aside>
  );
}