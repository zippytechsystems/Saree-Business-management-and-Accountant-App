# ZippyTechSystems — WhatsApp AI & Automation Setup Guide

> **Official Step-by-Step Implementation Guide**  
> **Company**: ZippyTechSystems Pvt. Ltd.  
> **Business WhatsApp Number**: `+91 63026 90251` (Configured dynamically via database / secrets)  
> **Supabase Webhook URL**: `https://cdrwrbmabcyhxngvyrxh.supabase.co/functions/v1/whatsapp-webhook`

---

## 🔒 Security Notice
> [!IMPORTANT]
> **Never paste any API token, app secret, or credentials into chat windows or code repositories.**  
> All secrets are configured strictly through your local terminal using the Supabase CLI (`supabase secrets set`).

---

## 📋 Table of Contents
1. [Step 1: Meta Business Account & Verification](#step-1-create-a-meta-business-account--verify-business)
2. [Step 2: Create Meta Developer App](#step-2-create-an-app-at-developersfacebookcom)
3. [Step 3: Test with Meta's Free Test Number](#step-3-test-first-with-metas-free-test-number)
4. [Step 4: Connect Real Number (+91 63026 90251) via Coexistence](#step-4-connect-the-real-number-6302690251-via-coexistence)
5. [Step 5: Generate Permanent System User Token](#step-5-create-a-permanent-system-user-access-token)
6. [Step 6: Configure Webhook & Subscriptions](#step-6-configure-the-supabase-webhook-in-meta)
7. [Step 7: Set Supabase Secrets & Deploy Functions](#step-7-set-supabase-secrets--deploy-edge-functions)
8. [Step 8: Message Templates (English, Telugu, Hindi)](#step-8-create-and-submit-message-templates)
9. [Step 9: Payment Method & Spend Limits](#step-9-add-a-payment-method--set-spend-limit)
10. [Step 10: WhatsApp Business Rules in Plain Language](#step-10-whatsapp-business-rules--policies-in-plain-language)
11. [Step 11: Troubleshooting Common Issues](#step-11-troubleshooting--faq)

---

## Step 1: Create a Meta Business Account & Verify Business

1. Navigate to **[Meta Business Suite](https://business.facebook.com/)**.
2. Click **Create Account** (top-right or center).
3. Fill in:
   - **Business Name**: `ZippyTechSystems Pvt. Ltd.`
   - **Your Name**: `Lingaswamy Maddeboina`
   - **Business Email**: `lingaswamymaddeboina@gmail.com`
4. Confirm your email by clicking the verification link sent by Meta.
5. In **Business Settings** (`business.facebook.com/settings`):
   - In the left sidebar, navigate to **Security Center**.
   - Under **Business Verification**, click **Start Verification**.
   - Upload official company incorporation documents for your Private Limited company:
     - Certificate of Incorporation (MCA)
     - Company PAN Card
     - GST Registration Certificate (matching the legal name and address)
     - Utility Bill or Bank Statement with the registered address.
   - Verification typically takes **24–72 hours**. While waiting, you can proceed with **Step 2 and Step 3** using Meta's free test sandbox!

---

## Step 2: Create an App at developers.facebook.com

1. Navigate to **[Meta for Developers](https://developers.facebook.com/)** and log in with your Facebook account.
2. Click **My Apps** (top-right) > **Create App**.
3. Choose Use Case / App Type:
   - Select **Other** > click **Next**.
   - Select **Business** > click **Next**.
4. Enter App Details:
   - **App Name**: `ZippyTechSystems WhatsApp Bot`
   - **App Contact Email**: `lingaswamymaddeboina@gmail.com`
   - **Business Portfolio**: Select your `ZippyTechSystems Pvt. Ltd.` Business Account created in Step 1.
   - Click **Create App**.
5. Add Products to Your App:
   - In the App Dashboard, scroll down to find **WhatsApp**.
   - Click **Set Up** on the WhatsApp card.
   - Accept the Meta WhatsApp Business Terms of Service.

---

## Step 3: Test First with Meta's Free Test Number

> [!TIP]
> Always validate Edge Functions, webhook handshakes, and AI knowledge retrieval with Meta's free test sandbox before connecting your real business SIM card!

1. In the Meta Developer App sidebar, click **WhatsApp** > **API Setup** (Quickstart).
2. Under **Step 1: Select phone numbers**:
   - You will see a pre-assigned test number: **Test Business Number** (usually a US +1 number).
   - Locate and copy:
     - **Phone number ID**: (Copy this number — this is your temporary `WA_PHONE_NUMBER_ID`).
     - **WhatsApp Business Account ID**: (Copy for reference).
     - **Temporary access token**: (Valid for 24 hours — used to test API calls).
3. Under **Step 2: Send and receive messages**:
   - In the **To** dropdown, select **Manage phone number list**.
   - Click **Add Phone Number**, enter your personal phone number with country code `+91`.
   - Meta will send a 6-digit OTP code to your personal WhatsApp. Enter the OTP to verify your number as an authorized test recipient.
4. Test sending a template message directly from the Meta dashboard:
   - Click **Send message**.
   - Check your personal WhatsApp: you will receive the `hello_world` welcome template!
5. Now proceed to configure the Webhook and Supabase Secrets (Steps 6 & 7) using this test `Phone Number ID` and temporary token. Verify that sending a message from your personal phone triggers an AI reply from your Supabase Edge Function!

---

## Step 4: Connect the Real Number (6302690251) via Coexistence

The **Coexistence Path** allows you to use the **same SIM card** on both the **WhatsApp Business mobile app on your Android/iPhone** AND the **WhatsApp Cloud API** simultaneously!

### Prerequisites for Coexistence
- **WhatsApp Business App Version**: Ensure your phone's WhatsApp Business app is updated to **v2.24.17 or newer** from Google Play Store or Apple App Store.
- **Single Provider**: The phone number `6302690251` must **not** be registered with any other WhatsApp Business Solution Provider (BSP) like Twilio, Wati, or Interakt.
- **Two-Step Verification**: If two-step verification is enabled in the mobile app, know your 6-digit PIN before onboarding.

### Onboarding Steps
1. In Meta Developer App dashboard, go to **WhatsApp** > **API Setup**.
2. Under **Step 1**, click **Add Phone Number**.
3. Fill in Business Profile Information:
   - **WhatsApp Business Display Name**: `ZippyTechSystems`
   - **Category**: `Software & Technology` / `Professional Services`
   - **Business Description**: `Build • Automate • Grow — Affordable Web, App & AI Solutions for SMBs.`
   - **Website**: `https://zippysoftwares.in`
4. Enter Phone Number:
   - Country: `India (+91)`
   - Phone Number: `6302690251`
5. Select Connection Method:
   - Choose **Connect existing WhatsApp Business App account (Coexistence)**.
   - Meta will display a QR code on your computer screen.
6. Link via Mobile App:
   - Open WhatsApp Business app on your phone (`6302690251`).
   - Tap **Settings** (or 3 dots) > **Linked Devices** > **Link a Device**.
   - Scan the QR code displayed on Meta Developer screen.
7. Verification:
   - Enter the SMS or voice OTP code sent to `6302690251` to finalize registration.
8. Copy the new **Phone Number ID**:
   - Meta assigns a permanent production **Phone Number ID** to `6302690251`. Copy this value!

### What Syncs in Coexistence Mode?
| Feature | Supported in Coexistence | Notes |
| :--- | :---: | :--- |
| **1:1 Customer Chats** | ✅ Yes | Inbound and outbound 1:1 messages sync between phone and API |
| **Contacts** | ✅ Yes | Contact names and numbers sync |
| **Message Echoes (`smb_message_echoes`)** | ✅ Yes | When you reply on your phone, webhook detects it and pauses AI |
| **Group Chats** | ❌ No | Group chats remain mobile-only; API does not see or reply to groups |
| **Broadcast Lists** | ❌ No | Native broadcasts are mobile-only |

---

## Step 5: Create a Permanent System User Access Token

Temporary tokens expire after 24 hours. A **System User Access Token** never expires!

1. Go to **[Meta Business Settings](https://business.facebook.com/settings)**.
2. In the left menu, click **Users** > **System Users**.
3. Click **Add** (Create System User):
   - **System User Name**: `ZippyTech Automation Bot`
   - **System User Role**: `Admin`
   - Click **Create System User**.
4. Assign Assets:
   - Select your new system user > click **Add Assets**.
   - Under **Apps**, select `ZippyTechSystems WhatsApp Bot` > toggle **Manage App (Full Control)** > click **Save Changes**.
   - Under **WhatsApp Accounts**, select your WhatsApp Business Account > toggle **Full Control** > click **Save Changes**.
5. Generate Permanent Token:
   - Under the system user, click **Generate New Token**.
   - Select your App: `ZippyTechSystems WhatsApp Bot`.
   - **Token Expiration**: Select **Never** (or permanent).
   - In the permissions list, check the following two mandatory permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - Click **Generate Token**.
6. Meta will show your token once. Copy and save it securely in a password manager. **This is your `WA_ACCESS_TOKEN`.**

---

## Step 6: Configure the Supabase Webhook in Meta

1. In Meta Developer App, click **WhatsApp** in the left sidebar > click **Configuration**.
2. Locate the **Webhook** section > click **Edit**:
   - **Callback URL**:  
     `https://cdrwrbmabcyhxngvyrxh.supabase.co/functions/v1/whatsapp-webhook`
   - **Verify Token**:  
     Create a random secret string (e.g. `zippy_wa_verify_2026_secure_key`).  
     *(You will set this same string as `WA_VERIFY_TOKEN` in Supabase).*
   - Click **Verify and Save**. Meta sends a `GET` challenge request to your Supabase function. When verified, a green checkmark appears!
3. Subscribe to Webhook Fields:
   - Under **Webhook fields**, click **Manage**.
   - Find **`messages`** > click **Subscribe**.
   - Find **`message_echoes`** / **`smb_message_echoes`** > click **Subscribe** (Critical for Coexistence so phone app replies are captured and AI is paused).
   - Click **Done**.

---

## Step 7: Set Supabase Secrets & Deploy Edge Functions

Run the following commands from your project root in PowerShell or Terminal.

### 1. Set Environment Secrets
```bash
# Set Meta WhatsApp credentials
supabase secrets set WA_PHONE_NUMBER_ID="your_phone_number_id_from_step_3_or_4"
supabase secrets set WA_ACCESS_TOKEN="your_permanent_system_user_token_from_step_5"
supabase secrets set WA_VERIFY_TOKEN="your_verify_token_chosen_in_step_6"

# Meta App Secret (Found in Meta Developers > App Settings > Basic > App Secret)
supabase secrets set WA_APP_SECRET="your_app_secret_here"

# OPTIONAL Personal Number for Admin WhatsApp Alerts
# IMPORTANT: WA_ADMIN_TO must NOT be 6302690251 (bot cannot message itself).
# Provide your separate personal mobile number with country code (e.g., 919876543210).
# If omitted or left empty, admin WhatsApp alerts are skipped silently and email is used.
supabase secrets set WA_ADMIN_TO="91XXXXXXXXXX"

# AI Model API Key (Anthropic Claude for live DB-grounded customer assistance)
supabase secrets set ANTHROPIC_API_KEY="your_claude_api_key"

# Email Notifications (Primary Admin Alert via Resend)
supabase secrets set EMAIL_API_KEY="re_your_resend_key"
supabase secrets set ADMIN_NOTIFY_EMAIL="lingaswamymaddeboina@gmail.com"
```

### 2. Deploy Edge Functions
Deploy all 4 Edge Functions to Supabase:
```bash
# Webhook receiver (Meta verification, incoming messages, app echoes)
supabase functions deploy whatsapp-webhook --no-verify-jwt

# Sender function (Manual replies & template sender with 24h window enforcement)
supabase functions deploy whatsapp-send

# Queue worker (Processes pending automation queue items respecting quiet hours)
supabase functions deploy whatsapp-automation-runner

# Lead & enquiry notifications dispatcher
supabase functions deploy notify-enquiry
```

### 3. Set Up Automation Cron Schedule
In Supabase Dashboard > **Database** > **Extensions**, ensure `pg_cron` and `pg_net` are enabled.  
Then in **SQL Editor**, schedule the automation runner to execute every 5 minutes:
```sql
SELECT cron.schedule(
  'process-whatsapp-queue-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://cdrwrbmabcyhxngvyrxh.supabase.co/functions/v1/whatsapp-automation-runner',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

---

## Step 8: Create and Submit Message Templates

Outside the 24-hour customer window, Meta requires pre-approved templates. Submit these templates in **WhatsApp Manager** (`business.facebook.com/wa/manage/templates`):

### Template 1: `enquiry_confirmation` (Category: UTILITY)
- **Languages**: English, Telugu, Hindi
- **English Body**:
  ```text
  Hi {{1}}, thank you for contacting ZippyTechSystems Pvt. Ltd. We have received your enquiry for {{2}} and will contact you within 24 hours.
  ```
  *(Sample values: `{{1}}` = `Ramesh`, `{{2}}` = `Web Development`)*
- **Telugu Body**:
  ```text
  నమస్తే {{1}}, ZippyTechSystems Pvt. Ltd. ని సంప్రదించినందుకు ధన్యవాదాలు. {{2}} కోసం మీ విచారణ అందింది. మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.
  ```
- **Hindi Body**:
  ```text
  नमस्ते {{1}}, ZippyTechSystems Pvt. Ltd. से संपर्क करने के लिए धन्यवाद। {{2}} के लिए आपकी पूछताछ मिल गई है और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।
  ```

### Template 2: `follow_up` (Category: UTILITY)
- **Languages**: English, Telugu, Hindi
- **English Body**:
  ```text
  Hi {{1}}, this is Lingaswamy from ZippyTechSystems. Following up on your enquiry for {{2}}. Would you like to schedule a quick call today?
  ```
- **Telugu Body**:
  ```text
  నమస్తే {{1}}, ZippyTechSystems నుండి లింగస్వామి. మీ {{2}} ప్రాజెక్ట్ వివరాల గురించి మాట్లాడటానికి ఈ రోజు మీకు అనుకూలమైన సమయం చెప్పగలరా?
  ```
- **Hindi Body**:
  ```text
  नमस्ते {{1}}, ZippyTechSystems से लिंगस्वामी। आपकी {{2}} पूछताछ के संदर्भ में, क्या आज हम फोन पर संक्षिप्त चर्चा कर सकते हैं?
  ```

### Template 3: `thank_you` (Category: UTILITY)
- **Languages**: English, Telugu, Hindi
- **English Body**:
  ```text
  Hi {{1}}, thank you for choosing ZippyTechSystems. Your project consultation is confirmed.
  ```
- **Telugu Body**:
  ```text
  నమస్తే {{1}}, ZippyTechSystems ను ఎంచుకున్నందుకు ధన్యవాదాలు. మీ ప్రాజెక్ట్ సంప్రదింపు ధృవీకరించబడింది.
  ```
- **Hindi Body**:
  ```text
  नमस्ते {{1}}, ZippyTechSystems को चुनने के लिए धन्यवाद। आपका प्रोजेक्ट परामर्श कन्फर्म हो गया है।
  ```

> [!NOTE]
> Meta's automated template review typically takes between **5 minutes to 24 hours**.

---

## Step 9: Add a Payment Method & Set Spend Limit

1. Go to **WhatsApp Manager** > **Settings** (Gear icon) > **Payment Settings**.
2. Click **Add Payment Method**:
   - Add a credit/debit card enabled for international transactions in INR.
3. Set a Monthly Spend Limit:
   - Under Payment Settings, set a safety spend limit (e.g. **₹1,000 / month**) to prevent unexpected charges.
4. Note on Free Tier:
   - Meta provides **1,000 free Service (Customer-Initiated) conversations per month** for every WhatsApp Business Account!

---

## Step 10: WhatsApp Business Rules & Policies in Plain Language

1. **The 24-Hour Customer Care Window**:
   - Whenever a customer sends a message to your WhatsApp number, a **24-hour timer starts**.
   - During these 24 hours, all bot responses and manual admin replies are **free-form text** and covered under the free customer-initiated service tier.
   - Once 24 hours elapse since the customer's last message, you **cannot send free text**. Meta's servers will reject it with error `131047`.
   - To re-engage a customer after 24 hours, you **must use an approved Meta template** (e.g. `follow_up`).

2. **User Opt-In Required**:
   - You must only message customers who initiated a chat or opted in via the website checkbox (`whatsapp_opt_in = true`).
   - If a customer types `STOP`, `STOP PROMO`, or `UNSUBSCRIBE`, the bot immediately marks them as `opted_out = true` and halts all automated replies.

3. **No Bulk Marketing / Spam**:
   - Do not purchase phone lists or send cold bulk marketing messages. WhatsApp will downgrade your phone number quality rating (`Green` ➔ `Yellow` ➔ `Red`) and may restrict sending limits.

4. **Pricing Updates**:
   - Meta regularly updates conversation-based and per-message pricing by country and category (Service, Utility, Authentication, Marketing).
   - Always verify current rates on the [Official Meta WhatsApp Pricing Page](https://developers.facebook.com/docs/whatsapp/pricing/).

---

## Step 11: Troubleshooting & FAQ

### 1. Webhook Not Verifying (`URL could not be validated`)
- **Cause**: Function not deployed or verify token mismatch.
- **Solution**:
  - Ensure `supabase functions deploy whatsapp-webhook --no-verify-jwt` was run.
  - Verify that `WA_VERIFY_TOKEN` in `supabase secrets list` matches the exact string you type into Meta's verification dialog.
  - Check function logs in Supabase Dashboard > Edge Functions > `whatsapp-webhook` > Logs.

### 2. Invalid Signature Error (`HMAC signature verification failed`)
- **Cause**: Incorrect `WA_APP_SECRET`.
- **Solution**: Go to Meta Developers > App Settings > Basic > Click "Show" next to App Secret. Update via `supabase secrets set WA_APP_SECRET="..."`.

### 3. Token Expired (`Session does not match` or `OAuthException`)
- **Cause**: Using a temporary 24-hour test token instead of a permanent System User token.
- **Solution**: Follow **Step 5** to create an Admin System User with `Never` expiration and assign `whatsapp_business_messaging`.

### 4. Number Not Eligible for Coexistence
- **Cause**: WhatsApp Business mobile app version is older than `2.24.17`, or number is still registered on an external BSP.
- **Solution**: Update the WhatsApp Business app from Google Play / App Store. If previously linked to another provider, delete the old WABA registration first.

### 5. Template Rejected
- **Cause**: Variables formatted incorrectly (e.g. `{1}` instead of `{{1}}`), or category chosen as `MARKETING` instead of `UTILITY`.
- **Solution**: Ensure category is set to `UTILITY`, remove promotional language, and provide sample parameter values.

### 6. Messages Not Delivered / Stuck on Single Tick (`✓`)
- **Cause**:
  - Customer's phone is switched off or lacks internet connectivity.
  - 24-hour window closed and a free-text message was attempted instead of a template.
  - The business number quality rating was temporarily restricted due to user spam reports.
- **Solution**: Check the delivery status ticks in your **Admin WhatsApp Live Inbox** (`/admin` > WhatsApp). Any Meta API errors are recorded with complete error details.
