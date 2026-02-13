import { PaymentRecord } from "@shared/api";

/**
 * Payment repository - abstracts payment data storage
 * In a real application, this would interact with a database
 */
class PaymentRepository {
  private payments: Map<string, PaymentRecord>;

  constructor() {
    this.payments = new Map();
  }

  /**
   * Find a payment by ID
   */
  findById(id: string): PaymentRecord | undefined {
    return this.payments.get(id);
  }

  /**
   * Find payment by application ID
   */
  findByApplicationId(applicationId: string): PaymentRecord | undefined {
    return Array.from(this.payments.values()).find(
      (payment) => payment.applicationId === applicationId,
    );
  }

  /**
   * Find all payments for a specific applicant email
   */
  findByApplicantEmail(email: string): PaymentRecord[] {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.applicantEmail === email,
    );
  }

  /**
   * Find payment by transaction ID
   */
  findByTransactionId(transactionId: string): PaymentRecord | undefined {
    return Array.from(this.payments.values()).find(
      (payment) => payment.transactionId === transactionId,
    );
  }

  /**
   * Create a new payment record
   */
  create(payment: PaymentRecord): PaymentRecord {
    this.payments.set(payment.id, payment);
    return payment;
  }

  /**
   * Update a payment record
   */
  update(id: string, updates: Partial<PaymentRecord>): PaymentRecord | undefined {
    const payment = this.payments.get(id);
    if (!payment) {
      return undefined;
    }
    const updated = { ...payment, ...updates };
    this.payments.set(id, updated);
    return updated;
  }

  /**
   * Get all payments (for admin purposes)
   */
  findAll(): PaymentRecord[] {
    return Array.from(this.payments.values());
  }

  /**
   * Find payments by status
   */
  findByStatus(status: PaymentRecord["status"]): PaymentRecord[] {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.status === status,
    );
  }

  /**
   * Delete a payment record (rarely used, for testing/cleanup)
   */
  delete(id: string): boolean {
    return this.payments.delete(id);
  }
}

export const paymentRepository = new PaymentRepository();
