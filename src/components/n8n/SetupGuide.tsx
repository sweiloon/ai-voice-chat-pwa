import * as Dialog from '@radix-ui/react-dialog'
import { HelpCircle, X, CheckCircle2, XCircle, Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

/**
 * SetupGuide - In-app guide for configuring N8N workflows
 *
 * Shows users how to set up workflows to receive text/voice input
 * Includes step-by-step instructions for different trigger types
 */
export const SetupGuide = () => {
  const [open, setOpen] = useState(false)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-accent"
          aria-label="Open N8N workflow setup guide"
        >
          <HelpCircle size={16} />
          Setup Guide
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-xl font-bold">
                N8N Workflow Setup Guide
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                Learn how to configure your N8N workflows to receive text and voice input from this app
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-2 transition hover:bg-accent"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-8">
            {/* Option 1: Webhook Trigger (Recommended) */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-green-500/10 p-2 text-green-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Option 1: Webhook Trigger (Recommended)</h3>
                  <p className="text-sm text-muted-foreground">
                    Best for text and voice input
                  </p>
                </div>
              </div>

              <div className="ml-11 space-y-4">
                <ol className="list-decimal space-y-3 pl-5 text-sm">
                  <li>In your N8N workflow, add a <strong>Webhook</strong> node as the first node</li>
                  <li>Configure the webhook settings:
                    <ul className="mt-2 space-y-1 pl-5 list-disc text-muted-foreground">
                      <li>HTTP Method: <code className="rounded bg-muted px-1.5 py-0.5">POST</code></li>
                      <li>Path: <code className="rounded bg-muted px-1.5 py-0.5">/voice-chat</code> (or any path you prefer)</li>
                      <li>Response Mode: <code className="rounded bg-muted px-1.5 py-0.5">Last Node</code></li>
                    </ul>
                  </li>
                  <li>Save and <strong>activate</strong> the workflow</li>
                  <li>Test by sending a message from this app</li>
                </ol>

                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="mb-2 text-xs font-semibold text-foreground">Expected Request Payload:</p>
                  <pre className="overflow-x-auto rounded bg-background p-3 text-xs font-mono">
{`{
  "message": "User text or voice input",
  "type": "text",
  "timestamp": "2025-01-15T10:30:00Z"
}`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('{"message":"User text or voice input","type":"text","timestamp":"2025-01-15T10:30:00Z"}', 'Payload example')}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Copy size={12} />
                    Copy payload
                  </button>
                </div>
              </div>
            </section>

            {/* Option 2: Chat Trigger */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-blue-500/10 p-2 text-blue-600">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Option 2: Chat Trigger</h3>
                  <p className="text-sm text-muted-foreground">
                    Alternative for chat-style interactions
                  </p>
                </div>
              </div>

              <div className="ml-11 space-y-4">
                <ol className="list-decimal space-y-3 pl-5 text-sm">
                  <li>Add a <strong>Chat Trigger</strong> node as the first node</li>
                  <li>Configure chat settings and response options</li>
                  <li>Save and activate the workflow</li>
                  <li>Messages will be sent to the chat trigger automatically</li>
                </ol>
              </div>
            </section>

            {/* Incompatible Triggers */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-full bg-red-500/10 p-2 text-red-600">
                  <XCircle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Incompatible Triggers (Won't Work)</h3>
                  <p className="text-sm text-muted-foreground">
                    These triggers cannot receive input from this app
                  </p>
                </div>
              </div>

              <div className="ml-11 space-y-2 text-sm">
                <ul className="space-y-2 pl-5 list-disc text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Schedule/Cron triggers</strong> - Time-based only, no external input
                  </li>
                  <li>
                    <strong className="text-foreground">Manual triggers</strong> - Require manual execution in N8N
                  </li>
                  <li>
                    <strong className="text-foreground">Email triggers</strong> - Only activated by incoming emails
                  </li>
                </ul>
              </div>
            </section>

            {/* Troubleshooting */}
            <section className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-3 text-sm font-semibold">Troubleshooting</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="mb-1 font-medium text-foreground">Workflow not appearing?</p>
                  <p>Make sure the workflow is <strong>activated</strong> in N8N. Inactive workflows won't show up in this app.</p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-foreground">Getting "Cannot send message" error?</p>
                  <p>The workflow's first node must be a Webhook or Chat trigger. Other trigger types can't receive external input.</p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-foreground">Need more help?</p>
                  <a
                    href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    N8N Webhook Documentation
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Got it
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
