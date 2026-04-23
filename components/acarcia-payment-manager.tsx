"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Calculator, TrendingUp, DollarSign } from "lucide-react"

interface AcarciaPayment {
  id: string
  payment_date: string
  payment_amount: number
  liters_covered: number
  calculated_price_per_liter: number
  payment_period_start: string
  payment_period_end: string
  created_at: string
}

interface PaymentFormData {
  payment_amount: string
  liters_sold: string
  period_start: string
  period_end: string
}

export default function AcarciaPaymentManager() {
  const [payments, setPayments] = useState<AcarciaPayment[]>([])
  const [lastMonthPayout, setLastMonthPayout] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<PaymentFormData>({
    payment_amount: "",
    liters_sold: "",
    period_start: "",
    period_end: ""
  })
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)

  // Load payment history and last month payout
  useEffect(() => {
    loadPaymentData()
  }, [])

  const loadPaymentData = async () => {
    try {
      // In a real implementation, these would be API calls to your backend
      // For now, we'll simulate the data
      
      // Simulate last month payout
      const mockLastMonth = 45.50 // KES per liter
      setLastMonthPayout(mockLastMonth)
      
      // Simulate payment history
      const mockPayments: AcarciaPayment[] = [
        {
          id: "1",
          payment_date: "2024-01-31",
          payment_amount: 50000,
          liters_covered: 1100,
          calculated_price_per_liter: 45.45,
          payment_period_start: "2024-01-01",
          payment_period_end: "2024-01-31",
          created_at: "2024-01-31T10:00:00Z"
        }
      ]
      setPayments(mockPayments)
    } catch (error) {
      console.error("Error loading payment data:", error)
    }
  }

  const calculatePrice = () => {
    const amount = parseFloat(formData.payment_amount)
    const liters = parseFloat(formData.liters_sold)
    
    if (amount && liters && liters > 0) {
      const price = amount / liters
      setCalculatedPrice(price)
    } else {
      setCalculatedPrice(null)
    }
  }

  useEffect(() => {
    calculatePrice()
  }, [formData.payment_amount, formData.liters_sold])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.payment_amount || !formData.liters_sold || !formData.period_start || !formData.period_end) {
      alert("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      const amount = parseFloat(formData.payment_amount)
      const liters = parseFloat(formData.liters_sold)
      const price = amount / liters

      // In a real implementation, this would call your backend API
      // For now, we'll simulate the response
      const newPayment: AcarciaPayment = {
        id: Date.now().toString(),
        payment_date: new Date().toISOString().split('T')[0],
        payment_amount: amount,
        liters_covered: liters,
        calculated_price_per_liter: price,
        payment_period_start: formData.period_start,
        payment_period_end: formData.period_end,
        created_at: new Date().toISOString()
      }

      setPayments(prev => [newPayment, ...prev])
      
      // Reset form
      setFormData({
        payment_amount: "",
        liters_sold: "",
        period_start: "",
        period_end: ""
      })
      setCalculatedPrice(null)
      
      alert(`Payment recorded successfully! Price per liter: KES ${price.toFixed(2)}`)
    } catch (error) {
      console.error("Error recording payment:", error)
      alert("Error recording payment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentMonthDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    }
  }

  useEffect(() => {
    const dates = getCurrentMonthDates()
    setFormData(prev => ({
      ...prev,
      period_start: dates.start,
      period_end: dates.end
    }))
  }, [])

  return (
    <div className="space-y-6">
      {/* Last Month Payout Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Last Month Payout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-700">
            KES {lastMonthPayout.toFixed(2)}
          </div>
          <p className="text-sm text-green-600 mt-1">
            Per liter paid to Acarcia
          </p>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Record Acarcia Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_amount">Total Amount Paid (KES)</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 50000"
                  value={formData.payment_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_amount: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="liters_sold">Total Liters Sold</Label>
                <Input
                  id="liters_sold"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 1100"
                  value={formData.liters_sold}
                  onChange={(e) => setFormData(prev => ({ ...prev, liters_sold: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="period_start">Payment Period Start</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, period_start: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="period_end">Payment Period End</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, period_end: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Calculated Price Display */}
            {calculatedPrice !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">Calculated Price Per Liter:</span>
                  <span className="text-2xl font-bold text-blue-700">
                    KES {calculatedPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !calculatedPrice}
            >
              {isLoading ? "Recording Payment..." : "Record Payment & Update Price"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No payment records found</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Payment: KES {payment.payment_amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">
                        {payment.liters_covered} liters × KES {payment.calculated_price_per_liter.toFixed(2)}/liter
                      </p>
                      <p className="text-xs text-gray-500">
                        Period: {payment.payment_period_start} to {payment.payment_period_end}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        KES {payment.calculated_price_per_liter.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">per liter</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
