import { RequestHandler } from "express";
import { PaymentRecord, RecordPaymentRequest, PaymentResponse, PaymentsListResponse } from "@shared/api";
import { paymentRepository } from "../repositories/paymentRepository";
import { applicationRepository } from "../repositories/applicationRepository";
import { userRepository } from "../repositories/userRepository";
import { z } from "zod";

/**
 * Validation schemas
 */
const RecordPaymentSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["razorpay", "bank_transfer", "cash", "cheque", "manual"]),
  transactionId: z.string().min(1, "Transaction ID is required"),
  notes: z.string().optional(),
  date: z.string().optional(),
});

/**
 * POST /api/payments/record
 * Record a new payment manually (admin/staff only)
 */
export const handleRecordPayment: RequestHandler = (req, res) => {
  try {
    // Validate request body
    const validation = RecordPaymentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.errors[0]?.message || "Invalid request data",
      });
      return;
    }

    const paymentData: RecordPaymentRequest = validation.data;
    const currentUser = (req as any).user;

    // Check if application exists
    const application = applicationRepository.findById(paymentData.applicationId);
    if (!application) {
      res.status(404).json({
        success: false,
        message: "Application not found",
      });
      return;
    }

    // Check if payment already exists for this application
    const existingPayment = paymentRepository.findByApplicationId(paymentData.applicationId);
    if (existingPayment) {
      res.status(400).json({
        success: false,
        message: "Payment already exists for this application",
      });
      return;
    }

    // Get user details
    const user = userRepository.findById(application.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Create payment record
    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      applicationId: paymentData.applicationId,
      applicantName: `${user.firstName} ${user.lastName}`,
      applicantEmail: user.email,
      service: application.serviceName,
      amount: paymentData.amount,
      status: "completed",
      method: paymentData.method,
      transactionId: paymentData.transactionId,
      date: paymentData.date || new Date().toISOString(),
      notes: paymentData.notes,
      recordedBy: currentUser?.id,
      recordedAt: new Date().toISOString(),
    };

    // Save payment
    const savedPayment = paymentRepository.create(paymentRecord);

    // Update application payment status
    applicationRepository.update(paymentData.applicationId, {
      paymentStatus: "paid",
      paymentAmount: paymentData.amount,
    });

    const response: PaymentResponse = {
      success: true,
      message: "Payment recorded successfully",
      payment: savedPayment,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record payment",
    });
  }
};

/**
 * GET /api/payments
 * Get all payment records (admin/staff only)
 */
export const handleGetPayments: RequestHandler = (req, res) => {
  try {
    const { status, email } = req.query;

    let payments = paymentRepository.findAll();

    // Filter by status if provided
    if (status && typeof status === "string") {
      payments = payments.filter((p) => p.status === status);
    }

    // Filter by email if provided
    if (email && typeof email === "string") {
      payments = payments.filter((p) => 
        p.applicantEmail.toLowerCase().includes(email.toLowerCase())
      );
    }

    // Sort by date (newest first)
    payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const response: PaymentsListResponse = {
      success: true,
      payments,
      total: payments.length,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      payments: [],
      total: 0,
    });
  }
};

/**
 * GET /api/payments/:id
 * Get a specific payment by ID
 */
export const handleGetPaymentById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;

    const payment = paymentRepository.findById(id);
    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
      });
      return;
    }

    const response: PaymentResponse = {
      success: true,
      message: "Payment retrieved successfully",
      payment,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
    });
  }
};

/**
 * GET /api/payments/application/:applicationId
 * Get payment for a specific application
 */
export const handleGetPaymentByApplicationId: RequestHandler = (req, res) => {
  try {
    const { applicationId } = req.params;

    const payment = paymentRepository.findByApplicationId(applicationId);
    if (!payment) {
      res.status(404).json({
        success: false,
        message: "No payment found for this application",
      });
      return;
    }

    const response: PaymentResponse = {
      success: true,
      message: "Payment retrieved successfully",
      payment,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
    });
  }
};

/**
 * PATCH /api/payments/:id/status
 * Update payment status (admin only)
 */
export const handleUpdatePaymentStatus: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses: PaymentRecord["status"][] = ["pending", "completed", "failed", "refunded"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
      return;
    }

    const payment = paymentRepository.findById(id);
    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
      });
      return;
    }

    // Update payment
    const updatedPayment = paymentRepository.update(id, {
      status,
      notes: notes || payment.notes,
    });

    // Update application payment status if refunded
    if (status === "refunded") {
      applicationRepository.update(payment.applicationId, {
        paymentStatus: "refunded",
      });
    }

    const response: PaymentResponse = {
      success: true,
      message: "Payment status updated successfully",
      payment: updatedPayment,
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
};
