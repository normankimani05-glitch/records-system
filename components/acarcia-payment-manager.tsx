"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, DollarSign, TrendingUp, Calculator, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface AcarciaPayment {
  id: string
  payment_date: string
  amount_paid: number
  payment_period_start: string
  payment_period_end: string
  liters_covered: number
  calculated_price_per_liter: number
  created_at: string
}

interface CurrentPricing {
  month_year: string
  current_price_per_liter: number
  last_payment_date: string
  total_amount_paid: number
  total_liters_sold: number
  price_label: string
}

export default function AcarciaPaymentManager({ user }: { user: { name: string; role: string } }) {
  const [paymentForm, setPaymentForm] = useState({
    payment_date: "",
    amount_paid: "",
    payment_period_start: "",
    payment_period_end: "",
    notes: ""
  })
  
  const [currentPricing, setCurrentPricing] = useState<CurrentPricing | null>(null)
  const [recentPayments, setRecentPayments] = useState<AcarciaPayment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  
  const supabase = createClient()

  // Load current pricing and recent payments
  useEffect(() => {
    loadCurrentPricing()
    loadRecentPayments()
  }, [])

  const loadCurrentPricing = async () => {
    try {
      const { data, error } = await supabase
        .from('current_acarcia_pricing')
        .select('*')
        .single()
      
      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading current pricing:', error)
      } else {
        setCurrentPricing(data)
      }
    } catch (error) {
      console.error('Error loading current pricing:', error)
    }
  }

  const loadRecentPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('acarcia_payments')
        .select('*')
        .order('payment_date', { ascending: false })
        .limit(5)
      
      if (error) {
        console.error('Error loading recent payments:', error)
      } else {
        setRecentPayments(data || [])
      }
    } catch (error) {
      console.error('Error loading recent payments:', error)
    }
  }

  const handleSubmitPayment = async () => {
    if (!paymentForm.payment_date || !paymentForm.amount_paid || 
        !paymentForm.payment_period_start || !paymentForm.payment_period_end) {
      alert("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      // Call the automatic pricing function
      const { error } = await supabase.rpc('auto_update_acarcia_pricing', {
        p_payment_date: paymentForm.payment_date,
        p_amount_paid: parseFloat(paymentForm.amount_paid),
        p_period_start: paymentForm.payment_period_start,
        p_period_end: paymentForm.payment_period_end,
        p_created_by: user.name
      })

      if (error) {
        console.error('Error processing payment:', error)
        alert("Error processing payment. Please try again.")
      } else {
        alert("Payment processed successfully! Price per liter calculated automatically.")
        
        // Reset form
        setPaymentForm({
          payment_date: "",
          amount_paid: "",
          payment_period_start: "",
          payment_period_end: "",
          notes: ""
        })
        
        // Reload data
        loadCurrentPricing()
        loadRecentPayments()
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      alert("Error processing payment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const setPeriodDates = (period: string) => {
    const now = new Date()
    let start: Date, end: Date

    switch (period) {
      case "current_month":
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case "last_month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "last_30_days":
        end = new Date()
        start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000))
        break
      default:
        return
    }

    setPaymentForm(prev => ({
      ...prev,
      payment_period_start: start.toISOString().split('T')[0],
      payment_period_end: end.toISOString().split('T')[0]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Current Pricing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Current Acarcia Pricing
          </CardTitle>
          <CardDescription>
            Last calculated price per liter based on actual payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentPricing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Price per Liter</div>
                  <div className="text-2xl font-bold text-green-800">
                    KES {currentPricing.current_price_per_liter.toFixed(4)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {currentPricing.price_label}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Last Payment</div>
                  <div className="text-lg font-semibold text-blue-800">
                    KES {currentPricing.total_amount_paid.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {currentPricing.total_liters_sold.toFixed(2)} liters
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <div>Period: {currentPricing.month_year}</div>
                <div>Last Updated: {new Date(currentPricing.last_payment_date).toLocaleDateString()}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <div>No pricing data available</div>
              <div className="text-sm">Process your first payment to calculate price per liter</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Processing Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Process Acarcia Payment
          </CardTitle>
          <CardDescription>
            Enter payment amount and period to automatically calculate price per liter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="amount_paid">Amount Paid (KES) *</Label>
              <Input
                id="amount_paid"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentForm.amount_paid}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount_paid: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <Label>Quick Period Selection</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeriodDates("current_month")}
              >
                Current Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeriodDates("last_month")}
              >
                Last Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPeriodDates("last_30_days")}
              >
                Last 30 Days
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period_start">Period Start Date *</Label>
              <Input
                id="period_start"
                type="date"
                value={paymentForm.payment_period_start}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_period_start: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="period_end">Period End Date *</Label>
              <Input
                id="period_end"
                type="date"
                value={paymentForm.payment_period_end}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_period_end: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Payment notes..."
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full"
            />
          </div>

          <Button 
            onClick={handleSubmitPayment}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Processing..." : "Process Payment & Calculate Price"}
          </Button>

          {message && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">{message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">KES {payment.amount_paid.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(payment.payment_date).toLocaleDateString()} • 
                      {payment.liters_covered.toFixed(2)} liters
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      KES {payment.calculated_price_per_liter.toFixed(4)}/L
                    </div>
                    <div className="text-xs text-gray-500">per liter</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
