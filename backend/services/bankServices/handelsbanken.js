/**
 * Handelsbanken Bank File Generation Service
 * Generates ISO 20022 pain.001.001.03 XML files for salary payments
 */

/**
 * Get the next 25th from today
 * @returns {string} Date in YYYY-MM-DD format
 */
function getNext25th() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    let targetDate;
    if (day < 25) {
        targetDate = new Date(year, month, 25);
    } else {
        targetDate = new Date(year, month + 1, 25);
    }
    
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format account number for bank file
 * Returns object with account info in correct format
 * @param {string} clearingNumber - Clearing number (4-5 digits)
 * @param {string} accountNumber - Account number (7-15 digits)
 * @returns {{accountId: string, accountType: string, clearingCode: string|null}}
 */
function formatAccountNumber(clearingNumber, accountNumber) {
    // Remove spaces and dashes
    const cleanClearing = (clearingNumber || '').replace(/[\s-]/g, '');
    const cleanAccount = (accountNumber || '').replace(/[\s-]/g, '');
    
    // Check if account is IBAN (starts with SE and is 24 chars)
    if (cleanAccount.startsWith('SE') && cleanAccount.length === 24) {
        return {
            accountId: cleanAccount,
            accountType: 'IBAN',
            clearingCode: null
        };
    }
    
    // National account with clearing number
    if (cleanClearing && cleanAccount) {
        // Can be entered as separate (clearing + account) or combined
        return {
            accountId: cleanClearing + cleanAccount,
            accountType: 'BBAN',
            clearingCode: cleanClearing
        };
    }
    
    // Account number only (11-15 digits might already include clearing)
    if (cleanAccount.length >= 11) {
        return {
            accountId: cleanAccount,
            accountType: 'BBAN',
            clearingCode: cleanAccount.substring(0, 4) // Extract first 4 digits as clearing
        };
    }
    
    // Default: national account without clearing
    return {
        accountId: cleanAccount,
        accountType: 'BBAN',
        clearingCode: cleanClearing || null
    };
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Generate ISO 20022 pain.001.001.03 XML for bank payment file
 * @param {Object[]} salaries - Array of salary objects
 * @param {Object} debtorInfo - Information about the organization (debtor)
 * @param {string} debtorInfo.name - Organization name
 * @param {string} debtorInfo.accountIBAN - Organization IBAN
 * @param {string} debtorInfo.bic - Organization BIC (optional)
 * @param {string} executionDate - Requested execution date (YYYY-MM-DD)
 * @returns {string} XML content
 */
function createBankFileXML(salaries, debtorInfo, executionDate) {
    const timestamp = new Date().toISOString();
    const messageId = `SALA-${Date.now()}`; // Unique message ID
    const numberOfTransactions = salaries.filter(s => s.totalSalary > 0).length;
    const totalAmount = salaries.reduce((sum, s) => sum + (s.totalSalary > 0 ? s.totalSalary : 0), 0).toFixed(2);
    
    // Start building XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n';
    xml += '  <CstmrCdtTrfInitn>\n';
    
    // Group Header
    xml += '    <GrpHdr>\n';
    xml += `      <MsgId>${messageId}</MsgId>\n`;
    xml += `      <CreDtTm>${timestamp}</CreDtTm>\n`;
    xml += `      <NbOfTxs>${numberOfTransactions}</NbOfTxs>\n`;
    xml += `      <CtrlSum>${totalAmount}</CtrlSum>\n`;
    xml += '      <InitgPty>\n';
    xml += `        <Nm>${escapeXml(debtorInfo.name)}</Nm>\n`;
    xml += '      </InitgPty>\n';
    xml += '    </GrpHdr>\n';
    
    // Payment Information
    xml += '    <PmtInf>\n';
    xml += `      <PmtInfId>${messageId}-1</PmtInfId>\n`;
    xml += '      <PmtMtd>TRF</PmtMtd>\n';
    xml += '      <BtchBookg>true</BtchBookg>\n';
    xml += `      <NbOfTxs>${numberOfTransactions}</NbOfTxs>\n`;
    xml += `      <CtrlSum>${totalAmount}</CtrlSum>\n`;
    
    // Payment Type Information
    xml += '      <PmtTpInf>\n';
    xml += '        <SvcLvl>\n';
    xml += '          <Cd>NURG</Cd>\n';
    xml += '        </SvcLvl>\n';
    xml += '        <CtgyPurp>\n';
    xml += '          <Cd>SALA</Cd>\n';
    xml += '        </CtgyPurp>\n';
    xml += '      </PmtTpInf>\n';
    
    // Requested Execution Date
    xml += `      <ReqdExctnDt>${executionDate}</ReqdExctnDt>\n`;
    
    // Debtor (Organization)
    xml += '      <Dbtr>\n';
    xml += `        <Nm>${escapeXml(debtorInfo.name)}</Nm>\n`;
    xml += '      </Dbtr>\n';
    
    // Debtor Account
    xml += '      <DbtrAcct>\n';
    xml += '        <Id>\n';
    xml += `          <IBAN>${debtorInfo.accountIBAN}</IBAN>\n`;
    xml += '        </Id>\n';
    xml += '      </DbtrAcct>\n';
    
    // Debtor Agent (if BIC provided)
    if (debtorInfo.bic) {
        xml += '      <DbtrAgt>\n';
        xml += '        <FinInstnId>\n';
        xml += `          <BIC>${debtorInfo.bic}</BIC>\n`;
        xml += '        </FinInstnId>\n';
        xml += '      </DbtrAgt>\n';
    }
    
    // Credit Transfer Transaction Information (one per employee)
    salaries.forEach((salary, index) => {
        // Only process if total salary is positive (something to pay)
        if (salary.totalSalary <= 0) return;
        
        const accountInfo = formatAccountNumber(salary.clearingNumber, salary.accountNumber);
        const amount = salary.totalSalary.toFixed(2);
        
        xml += '      <CdtTrfTxInf>\n';
        xml += '        <PmtId>\n';
        xml += `          <EndToEndId>${messageId}-${index + 1}</EndToEndId>\n`;
        xml += '        </PmtId>\n';
        
        // Amount
        xml += '        <Amt>\n';
        xml += `          <InstdAmt Ccy="SEK">${amount}</InstdAmt>\n`;
        xml += '        </Amt>\n';
        
        // Creditor Agent (Clearing number or BIC)
        if (accountInfo.accountType === 'IBAN') {
            // For IBAN, BIC is optional - skip if not available
            // xml += '        <CdtrAgt>\n';
            // xml += '          <FinInstnId>\n';
            // xml += '            <BIC>HANDSESS</BIC>\n';
            // xml += '          </FinInstnId>\n';
            // xml += '        </CdtrAgt>\n';
        } else if (accountInfo.clearingCode) {
            xml += '        <CdtrAgt>\n';
            xml += '          <FinInstnId>\n';
            xml += '            <ClrSysMmbId>\n';
            xml += '              <ClrSysId>\n';
            xml += '                <Cd>SESBA</Cd>\n';
            xml += '              </ClrSysId>\n';
            xml += `              <MmbId>${accountInfo.clearingCode}</MmbId>\n`;
            xml += '            </ClrSysMmbId>\n';
            xml += '          </FinInstnId>\n';
            xml += '        </CdtrAgt>\n';
        }
        
        // Creditor (Employee)
        xml += '        <Cdtr>\n';
        xml += `          <Nm>${escapeXml(salary.employeeName)}</Nm>\n`;
        xml += '        </Cdtr>\n';
        
        // Creditor Account
        xml += '        <CdtrAcct>\n';
        xml += '          <Id>\n';
        if (accountInfo.accountType === 'IBAN') {
            xml += `            <IBAN>${accountInfo.accountId}</IBAN>\n`;
        } else {
            xml += '            <Othr>\n';
            xml += `              <Id>${accountInfo.accountId}</Id>\n`;
            xml += '              <SchmeNm>\n';
            xml += '                <Cd>BBAN</Cd>\n';
            xml += '              </SchmeNm>\n';
            xml += '            </Othr>\n';
        }
        xml += '          </Id>\n';
        xml += '        </CdtrAcct>\n';
        
        // Remittance Information (optional - salary description)
        xml += '        <RmtInf>\n';
        xml += `          <Ustrd>Lön ${salary.employeeName}</Ustrd>\n`;
        xml += '        </RmtInf>\n';
        
        xml += '      </CdtTrfTxInf>\n';
    });
    
    xml += '    </PmtInf>\n';
    xml += '  </CstmrCdtTrfInitn>\n';
    xml += '</Document>\n';
    
    return xml;
}

/**
 * Create Handelsbanken bank payment file for salaries
 * @param {Object[]} salaries - Array of salary objects to pay
 * @param {Object} options - Payment options
 * @param {string} options.organizationName - Name of the organization
 * @param {string} options.organizationIBAN - Organization's IBAN account
 * @param {string} options.organizationBIC - Organization's BIC (optional)
 * @param {string} options.executionDate - Requested execution date (YYYY-MM-DD)
 * @param {string} options.outputPath - Path where to save the XML file (optional)
 * @returns {Promise<{xml: string, filename: string, totalAmount: number, transactionCount: number, executionDate: string}>}
 */
export async function createHandelsbankenBankFile(salaries, options) {
    if (!salaries || salaries.length === 0) {
        throw new Error('No salaries to process');
    }
    
    // Validate required options
    if (!options.organizationName) {
        throw new Error('Organization name is required');
    }
    if (!options.organizationIBAN) {
        throw new Error('Organization IBAN is required');
    }
    
    // Default execution date to next 25th of the month
    const executionDate = options.executionDate || getNext25th();
    
    const debtorInfo = {
        name: options.organizationName,
        accountIBAN: options.organizationIBAN,
        bic: options.organizationBIC || null
    };
    
    // Generate XML
    const xml = createBankFileXML(salaries, debtorInfo, executionDate);
    
    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `handelsbanken_salary_payment_${dateStr}.xml`;
    
    // Calculate totals
    const totalAmount = salaries.reduce((sum, s) => sum + (s.totalSalary > 0 ? s.totalSalary : 0), 0);
    const transactionCount = salaries.filter(s => s.totalSalary > 0).length;
    
    // Save to file if output path provided
    if (options.outputPath) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const fullPath = path.join(options.outputPath, filename);
        await fs.writeFile(fullPath, xml, 'utf-8');
    }
    
    return {
        xml,
        filename,
        totalAmount,
        transactionCount,
        executionDate
    };
}

