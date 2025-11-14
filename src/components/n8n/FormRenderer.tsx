import { useState, type FormEvent } from 'react'
import { Loader2, Send, CheckCircle2 } from 'lucide-react'
import type { N8NFormField } from '@/n8n/types'

interface FormRendererProps {
  workflowName: string
  fields: N8NFormField[]
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  submitting?: boolean
}

/**
 * FormRenderer - Render N8N form trigger fields
 *
 * Displays form fields from N8N Form Trigger node and submits data to workflow
 */
export const FormRenderer = ({ workflowName, fields, onSubmit, submitting = false }: FormRendererProps) => {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    fields.forEach(field => {
      initial[field.name] = field.defaultValue ?? (field.type === 'checkbox' ? false : '')
    })
    return initial
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      await onSubmit(formData)
      setSubmitted(true)
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false)
        // Reset to default values
        const reset: Record<string, unknown> = {}
        fields.forEach(field => {
          reset[field.name] = field.defaultValue ?? (field.type === 'checkbox' ? false : '')
        })
        setFormData(reset)
      }, 3000)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const updateField = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const renderField = (field: N8NFormField) => {
    const baseInputClasses = "w-full rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            name={field.name}
            value={String(formData[field.name] ?? '')}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.required}
            className={baseInputClasses}
            disabled={submitting}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )

      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={String(formData[field.name] ?? '')}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.required}
            rows={4}
            className={`${baseInputClasses} resize-none`}
            disabled={submitting}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )

      case 'select':
        return (
          <select
            name={field.name}
            value={String(formData[field.name] ?? '')}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.required}
            className={baseInputClasses}
            disabled={submitting}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <label className="inline-flex items-center gap-2 md:gap-3 cursor-pointer">
            <input
              type="checkbox"
              name={field.name}
              checked={Boolean(formData[field.name])}
              onChange={(e) => updateField(field.name, e.target.checked)}
              className="w-4 h-4 md:w-5 md:h-5 rounded border-border/50 text-primary focus:ring-primary focus:ring-2"
              disabled={submitting}
            />
            <span className="text-xs md:text-sm text-foreground">{field.label}</span>
          </label>
        )

      default:
        return null
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 md:gap-4 py-12 md:py-16 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
        </div>
        <div className="space-y-1 md:space-y-2">
          <h3 className="text-lg md:text-xl font-semibold text-foreground">Form Submitted!</h3>
          <p className="text-sm md:text-base text-muted-foreground">
            Your form has been sent to "{workflowName}"
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">{workflowName}</h2>
        <p className="text-xs md:text-sm text-muted-foreground">Fill out the form below to trigger this workflow</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        {fields.map((field) => (
          <div key={field.name} className="space-y-1.5 md:space-y-2">
            {field.type !== 'checkbox' && (
              <label htmlFor={field.name} className="block text-sm md:text-base font-medium text-foreground">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            {renderField(field)}
          </div>
        ))}

        <div className="pt-4 md:pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 md:gap-3 rounded-xl bg-primary px-6 py-3 md:py-4 text-sm md:text-base font-semibold text-primary-foreground shadow-md transition-all hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="md:w-5 md:h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} className="md:w-5 md:h-5" />
                Submit Form
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 md:mt-8 p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-xs md:text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> This form is connected to an N8N workflow.
          Your submission will trigger the workflow and you'll see the response here.
        </p>
      </div>
    </div>
  )
}
