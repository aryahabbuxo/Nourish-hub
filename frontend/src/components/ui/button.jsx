import * as React from "react"

const Button = React.forwardRef(({ className = "", variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50"
  }
  const sizes = {
    default: "h-10 px-4 py-2",
    lg: "h-11 px-8"
  }
  return <button ref={ref} className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
})
Button.displayName = "Button"

export { Button }