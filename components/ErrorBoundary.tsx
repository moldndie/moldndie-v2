"use client"

import { Button } from "@/components/ui/button"
import { Component, type ReactNode } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: "" }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] px-6 text-center">
          <AlertTriangle size={40} className="text-amber-400 mb-4" strokeWidth={1.5} />
          <p className="text-zinc-800 font-semibold text-lg">Something went wrong</p>
          <p className="text-zinc-400 text-sm mt-1 max-w-sm">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <Button onClick={this.handleReset} className="mt-6 h-auto gap-2 px-5 py-2.5 font-semibold">
            <RotateCcw size={14} />
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
