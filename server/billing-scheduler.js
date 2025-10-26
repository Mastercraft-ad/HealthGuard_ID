import cron from "node-cron";
import { storage } from "./storage";
export function startBillingScheduler() {
    // Run monthly billing on the 1st day of each month at 2:00 AM
    // Cron format: minute hour day-of-month month day-of-week
    // For testing: "*/5 * * * *" runs every 5 minutes
    // For production: "0 2 1 * *" runs at 2:00 AM on the 1st of each month
    const schedule = process.env.NODE_ENV === "production"
        ? "0 2 1 * *" // Monthly: 2:00 AM on the 1st
        : "0 */6 * * *"; // Development: Every 6 hours for testing
    cron.schedule(schedule, async () => {
        console.log(`[Billing Scheduler] Starting monthly billing cycle at ${new Date().toISOString()}`);
        try {
            const providers = await storage.getInsuranceProviders();
            let totalProcessed = 0;
            let totalDisconnected = 0;
            for (const provider of providers) {
                try {
                    const connections = await storage.getProviderConnections(provider.id);
                    const connectedPatients = connections.filter(c => c.status === "connected");
                    for (const connection of connectedPatients) {
                        // Simulate payment processing (in a real system, this would integrate with payment gateway)
                        const paymentSuccessful = Math.random() > 0.1; // 90% success rate
                        if (paymentSuccessful) {
                            // Payment successful, reset missed payments count
                            await storage.updateConnectionBilling(connection.id, new Date(), 0);
                            totalProcessed++;
                        }
                        else {
                            // Payment failed, increment missed payments count
                            const newMissedCount = (connection.missedPaymentsCount || 0) + 1;
                            await storage.updateConnectionBilling(connection.id, connection.lastBillingDate || new Date(), newMissedCount);
                            // Auto-disconnect if 3 or more consecutive missed payments
                            if (newMissedCount >= 3) {
                                await storage.disconnectInsurance(connection.id);
                                await storage.createAuditLog({
                                    userId: connection.patientId,
                                    action: "insurance_auto_disconnected",
                                    targetType: "insurance_connection",
                                    targetId: connection.id,
                                    metadata: {
                                        reason: "3 consecutive missed payments",
                                        missedPaymentsCount: newMissedCount,
                                        providerId: provider.id,
                                        providerName: provider.providerName,
                                    },
                                });
                                console.log(`[Billing Scheduler] Auto-disconnected patient ${connection.patientId} from ${provider.providerName} (${newMissedCount} missed payments)`);
                                totalDisconnected++;
                            }
                            else {
                                console.log(`[Billing Scheduler] Payment failed for patient ${connection.patientId} (${newMissedCount} missed payments)`);
                            }
                        }
                    }
                    // Create audit log for this provider's billing cycle
                    await storage.createAuditLog({
                        userId: provider.userId,
                        action: "monthly_billing_processed_auto",
                        targetType: "insurance_provider",
                        targetId: provider.id,
                        metadata: {
                            connectedPatients: connectedPatients.length,
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
                catch (error) {
                    console.error(`[Billing Scheduler] Error processing billing for provider ${provider.id}:`, error);
                }
            }
            console.log(`[Billing Scheduler] Completed monthly billing cycle. Processed: ${totalProcessed}, Disconnected: ${totalDisconnected}`);
        }
        catch (error) {
            console.error("[Billing Scheduler] Error in billing cycle:", error);
        }
    });
    console.log(`[Billing Scheduler] Initialized with schedule: ${schedule}`);
    console.log(`[Billing Scheduler] ${process.env.NODE_ENV === "production" ? "Monthly billing will run on the 1st at 2:00 AM" : "Development mode: Billing runs every 6 hours for testing"}`);
}
