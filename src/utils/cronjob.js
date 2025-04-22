const cron = require("node-cron");
const { startOfYesterday, endOfYesterday } = require("date-fns");
const connectionRequest = require("../models/connectionRequest");
const { sendCustomEmail } = require("../utils/sendEmail");

cron.schedule("0 6 * * *", async () => {
  try {
    const yesterdayStart = startOfYesterday();
    const yesterdayEnd = endOfYesterday();

    const pendingRequests = await connectionRequest.find({
      status: "interested",
      createdAt: {
        $gte: yesterdayStart,
        $lt: yesterdayEnd,
      },
    }).populate("toUserId");

    const emails = [
      ...new Set(
        pendingRequests
          .map((req) => req.toUserId?.emailId)
          .filter((emailId) => !!emailId)
      ),
    ];

    const subject = "Action Needed: Pending Connection Requests on DevConnect";

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; background-color: #ffffff;">
        <h2 style="color: #1D4ED8; margin-bottom: 16px;">👋 Hello from DevConnect</h2>
    
        <p style="font-size: 16px; color: #111827; margin-bottom: 12px;">
          You have <strong>pending connection requests</strong> that were marked as <span style="color: #059669;">Interested</span> yesterday on <strong>DevConnect</strong>.
        </p>
    
        <p style="font-size: 15px; color: #374151; margin-bottom: 16px;">
          Don’t miss this opportunity to connect with professionals who are eager to collaborate or mentor. Your network is your net worth—take the next step today!
        </p>
    
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    
        <p style="font-size: 13px; color: #6B7280; margin-bottom: 4px;">
          This is an automated reminder from DevConnect.
        </p>
        <p style="font-size: 13px; color: #6B7280;">
          If you believe you received this message in error, please contact our support team or simply disregard this email.
        </p>
    
        <footer style="margin-top: 32px; font-size: 12px; color: #9CA3AF; text-align: center;">
          — The DevConnect Team
        </footer>
      </div>
    `;
    

    for (let email of emails) {
      await sendCustomEmail({ to: email, subject, html });
    }

 
  } catch (err) {
    console.error("Error in cron job:", err.message);
  }
});
