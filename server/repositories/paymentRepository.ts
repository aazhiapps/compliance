import { PaymentRecord } from "@shared/api";
import { PaymentModel, IPaymentDocument } from "../models/Payment";

/**
 * Payment repository - abstracts payment data storage using MongoDB
 */
class PaymentRepository {
  /**
   * Convert MongoDB document to PaymentRecord type
   */
  private toPaymentRecord(doc: IPaymentDocument): PaymentRecord {
    return doc.toJSON() as PaymentRecord;
  }

  /**
   * Find a payment by ID
   */
  async findById(id: string): Promise<PaymentRecord | undefined> {
    const payment = await PaymentModel.findById(id);
    return payment ? this.toPaymentRecord(payment) : undefined;
  }

  /**
   * Find payment by application ID
   */
  async findByApplicationId(applicationId: string): Promise<PaymentRecord | undefined> {
    const payment = await PaymentModel.findOne({ applicationId });
    return payment ? this.toPaymentRecord(payment) : undefined;
  }

  /**
   * Find all payments for a specific applicant email
   */
  async findByApplicantEmail(email: string): Promise<PaymentRecord[]> {
    const payments = await PaymentModel.find({ applicantEmail: email });
    return payments.map((payment) => this.toPaymentRecord(payment));
  }

  /**
   * Find payment by transaction ID
   */
  async findByTransactionId(transactionId: string): Promise<PaymentRecord | undefined> {
    const payment = await PaymentModel.findOne({ transactionId });
    return payment ? this.toPaymentRecord(payment) : undefined;
  }

  /**
   * Create a new payment record
   */
  async create(payment: PaymentRecord): Promise<PaymentRecord> {
    const newPayment = await PaymentModel.create(payment);
    return this.toPaymentRecord(newPayment);
  }

  /**
   * Update a payment record
   */
  async update(id: string, updates: Partial<PaymentRecord>): Promise<PaymentRecord | undefined> {
    const payment = await PaymentModel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    return payment ? this.toPaymentRecord(payment) : undefined;
  }

  /**
   * Get all payments (for admin purposes)
   */
  async findAll(): Promise<PaymentRecord[]> {
    const payments = await PaymentModel.find().sort({ date: -1 });
    return payments.map((payment) => this.toPaymentRecord(payment));
  }

  /**
   * Find payments by status
   */
  async findByStatus(status: PaymentRecord["status"]): Promise<PaymentRecord[]> {
    const payments = await PaymentModel.find({ status });
    return payments.map((payment) => this.toPaymentRecord(payment));
  }

  /**
   * Delete a payment record (rarely used, for testing/cleanup)
   */
  async delete(id: string): Promise<boolean> {
    const result = await PaymentModel.findByIdAndDelete(id);
    return result !== null;
  }
}

export const paymentRepository = new PaymentRepository();
