'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What is Babnunur?',
    a: 'Babnunur is an AI-powered productivity platform that combines chat, document management, intelligent search, and workflow automation into one seamless workspace.',
  },
  {
    q: 'How does the AI work?',
    a: 'Our platform integrates multiple AI models including Gemini and DeepSeek. The AI is context-aware and adapts to your work patterns to provide relevant assistance.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data is encrypted at rest and in transit. We use role-based access control and comply with industry security standards.',
  },
  {
    q: 'Can I integrate with other tools?',
    a: 'Enterprise plans include custom integrations. We also support webhooks and API access for connecting with your existing toolchain.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes, we offer a free tier that includes 3 projects, 100 AI conversations, and 5 documents. Upgrade anytime as your needs grow.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Got questions? We have answers.
          </p>
        </div>
        <div className="mt-16 space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border bg-card"
            >
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-card-foreground">{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="border-t px-6 py-4">
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
