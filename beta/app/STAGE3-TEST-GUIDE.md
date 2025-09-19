# Stage 3 (Representation & Mediation) Test Guide

## ✅ Implementation Complete

The Stage 3 functionality has been successfully implemented with the following features:

### Features Implemented:
1. **API Endpoints**
   - `/api/transactions/[id]/stage3` - Check and update Stage 3 requirements
   - Document upload support for REPRESENTATION_DOCUMENT and MEDIATION_AGREEMENT types

2. **UI Component**
   - `Stage3Panel` component integrated into transaction page
   - Shows when transaction status is AGREEMENT
   - Real-time status tracking of all requirements

3. **Validation**
   - Prevents advancement to ESCROW without completing all Stage 3 requirements
   - Validates document uploads and party confirmations

## 🧪 Test Scenario Created

A test transaction has been created with the following details:
- **Transaction ID**: cmfc9mufr0003h2yziizuctcf
- **Property**: Test Property for Stage 3
- **Status**: AGREEMENT (Stage 3)
- **Buyer**: buyer@test.com (password: password123)
- **Seller**: seller@test.com (password: password123)

## 📋 Testing Steps

### 1. Access the Transaction Page
Navigate to: http://95.179.170.56:3019/transactions/cmfc9mufr0003h2yziizuctcf

### 2. Login as Buyer
- Email: `buyer@test.com`
- Password: `password123`

### 3. Complete Buyer Tasks
When logged in as buyer, you should see the Stage 3 panel with:

a) **Upload Documents Section**:
   - Upload a PDF file as "Legal Representation Document"
   - Upload a PDF file as "Mediation Agreement"

b) **Confirmations Section**:
   - Click "Confirm Representation" (after uploading representation doc)
   - Click "Sign Mediation Agreement" (after uploading mediation agreement)

### 4. Login as Seller
- Email: `seller@test.com`
- Password: `password123`

### 5. Complete Seller Tasks
When logged in as seller, complete:
- Click "Confirm Representation" 
- The mediation agreement is shared between parties

### 6. Verify Stage 3 Completion
Once all requirements are met:
- All status indicators should show green checkmarks
- "Stage 3 Complete" badge should appear
- "Proceed to Escrow Stage" button becomes available

### 7. Advance to Escrow
Click "Proceed to Escrow Stage" to advance the transaction

## 🔍 What to Look For

### Visual Indicators:
- ✅ Green checkmarks for completed items
- ❌ Gray X marks for pending items
- Progress badges showing current status
- Alert messages for successful actions

### Stage 3 Requirements Panel Shows:
1. **Document Status**
   - Representation Document upload status
   - Mediation Agreement upload status

2. **Party Confirmations**
   - Buyer representation confirmation
   - Seller representation confirmation
   - Mediation agreement signing status

3. **Overall Status**
   - Stage 3 complete indicator
   - Ability to advance to Escrow

## 🛠️ Technical Details

### Database Fields Updated:
- `transaction.buyerHasRep` - Buyer's representation confirmation
- `transaction.sellerHasRep` - Seller's representation confirmation
- `transaction.mediationSigned` - Mediation agreement signed status
- `documents` table - Stores uploaded documents

### Validation Rules:
1. Both parties must upload/confirm representation document
2. Mediation agreement must be uploaded and signed
3. All confirmations must be complete before advancing to Escrow

## 📝 Notes

- The system prevents advancing to ESCROW stage without completing all Stage 3 requirements
- Documents are stored in `/uploads/transactions/[transactionId]/` directory
- Each action is tracked in the transaction status history
- Notifications are sent to the other party when documents are uploaded

## 🚀 Quick Test Commands

Check Stage 3 status via API:
```bash
curl http://95.179.170.56:3019/api/transactions/cmfc9mufr0003h2yziizuctcf/stage3 \
  -H "Cookie: [session-cookie]"
```

## ✨ Success Criteria

The Stage 3 implementation is successful when:
1. ✅ Documents can be uploaded for representation and mediation
2. ✅ Both parties can confirm their representation
3. ✅ Mediation agreement can be signed
4. ✅ Stage completion is properly tracked
5. ✅ Transaction can advance to ESCROW only after all requirements are met
6. ✅ UI clearly shows the status of each requirement

---

**Implementation Status**: ✅ COMPLETE
**Ready for Testing**: YES
**Test Transaction Available**: YES