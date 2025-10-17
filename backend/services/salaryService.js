import { createSupabaseClientFromEnv } from '../supabase.js';
import { createHandelsbankenBankFile } from './bankServices/handelsbanken.js';
import dotenv from 'dotenv';

// Load environment variables (for standalone testing)
dotenv.config();

/**
 * @typedef {Object} SalaryBreakdownItem
 * @property {string} description - Description of the compensation item
 * @property {number} amount - Amount per unit
 * @property {number} quantity - Number of units
 * @property {string} costCenter - Cost center code
 * @property {string} activityType - Activity/salary type code
 * @property {string} comment - Optional comment
 * @property {string} dateMonth - Month/year the compensation is for
 */

/**
 * @typedef {Object} SalaryPerson
 * @property {string} organizationId - Organization ID
 * @property {string} employeeId - Employee ID (from Fortnox or internal)
 * @property {string} employeeName - Full name of employee
 * @property {string} employeeEmail - Employee email address
 * @property {number} baseSalary - Base salary (sum of all compensations)
 * @property {number} socialaAvgifter - Social fees amount (employer cost, not deducted from employee)
 * @property {number} semesterersattning - Holiday pay (12% of base)
 * @property {number} skatt - Tax amount (deducted from employee salary)
 * @property {number} totalSalary - Net salary after tax (what employee receives)
 * @property {string} bankName - Name of bank (if available)
 * @property {string} clearingNumber - Bank clearing number
 * @property {string} accountNumber - Bank account number
 * @property {string} personnummer - Personal number
 * @property {boolean} hasSocialaAvgifter - Whether social fees apply
 * @property {SalaryBreakdownItem[]} breakdown - Array of compensation items
 */

/**
 * Get table names for an organization
 * Currently returns dummy test tables, will be dynamic based on org_id later
 * @param {string} organizationId - Organization ID
 * @returns {{personnelTable: string, compensationsTable: string}}
 */
function getOrgTableNames(organizationId) {
    // TODO: In the future, query the database to get actual table names
    // For now, return hardcoded test tables
    return {
        personnelTable: 'test_frening_personnel',
        compensationsTable: 'test_frening_compensations'
    };
}

/**
 * Collect all unpushed salaries for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<SalaryPerson[]>} Array of salary objects
 */
export async function collectUnpushedSalaries(organizationId) {
    const supabase = await createSupabaseClientFromEnv();
    if (!supabase) {
        throw new Error('Supabase client not available');
    }

    const { personnelTable, compensationsTable } = getOrgTableNames(organizationId);

    // Fetch all compensations that haven't been added to Fortnox
    const { data: compensations, error: compError } = await supabase
        .from(compensationsTable)
        .select('*')
        .or('added_to_fortnox.eq.false,added_to_fortnox.is.null')
        .order('employee_id', { ascending: true });

    if (compError) {
        throw new Error(`Error fetching compensations: ${compError.message}`);
    }

    if (!compensations || compensations.length === 0) {
        return [];
    }

    // Get unique employee IDs
    const employeeIds = [...new Set(compensations.map(c => c.employee_id).filter(Boolean))];

    // Fetch personnel data for these employees
    const { data: personnel, error: persError } = await supabase
        .from(personnelTable)
        .select('*')
        .in('fortnox_employee_id', employeeIds);

    if (persError) {
        throw new Error(`Error fetching personnel: ${persError.message}`);
    }

    // Create a map of employee_id to personnel data
    const personnelMap = new Map();
    if (personnel) {
        personnel.forEach(p => {
            personnelMap.set(p.fortnox_employee_id, p);
        });
    }

    // Group compensations by employee
    const salaryByEmployee = new Map();

    compensations.forEach(comp => {
        const employeeId = comp.employee_id;
        if (!employeeId) return;

        if (!salaryByEmployee.has(employeeId)) {
            salaryByEmployee.set(employeeId, []);
        }
        salaryByEmployee.get(employeeId).push(comp);
    });

    // Build salary objects
    const salaryPersons = [];

    salaryByEmployee.forEach((comps, employeeId) => {
        const person = personnelMap.get(employeeId);
        
        // Calculate base salary from all compensations
        let baseSalary = 0;
        const breakdown = [];

        comps.forEach(comp => {
            const amount = parseFloat(comp['Ersättning']) || 0;
            const quantity = parseFloat(comp['Antal']) || 1;
            const itemTotal = amount * quantity;
            baseSalary += itemTotal;

            //ska project in? HUR SKA DET GÖRAS?
            breakdown.push({
                description: comp['Aktivitetstyp'] || 'Unknown',
                amount: amount,
                quantity: quantity,
                costCenter: comp['Kostnadsställe'] || '',
                activityType: comp['Aktivitetstyp'] || '',
                comment: comp['Eventuell kommentar'] || '',
                dateMonth: comp['Avser Mån/år'] || ''
            });
        });

        
        const semesterersattning = baseSalary * 0.12;

        // Check if social fees apply
        const hasSocialaAvgifter = person ? (person['Sociala Avgifter'] === true) : false;
        
        // Calculate social fees (sociala avgifter) - typically 31.42% in Sweden
        const socialaAvgifter = hasSocialaAvgifter ? (baseSalary + semesterersattning) * 0.3142 : 0;

        const skatt = (person ? (person['Skattesats'] || 0)/100 : 0) * (baseSalary + semesterersattning);

        // Calculate total
        const totalSalary = (baseSalary + semesterersattning) - skatt;

        const salaryPerson = {
            organizationId: organizationId,
            employeeId: employeeId,
            employeeName: person ? `${person['Förnamn'] || ''} ${person['Efternamn'] || ''}`.trim() : comps[0]['Ledare'] || 'Unknown',
            employeeEmail: person ? person['E-post'] || '' : '',
            personnummer: person ? person['Personnummer'] || '' : '',
            baseSalary: baseSalary,
            socialaAvgifter: socialaAvgifter,
            skatt: skatt,
            semesterersattning: semesterersattning,
            totalSalary: totalSalary,
            hasSocialaAvgifter: hasSocialaAvgifter,
            bankName: '', // Not available in current schema
            clearingNumber: person ? person['Clearingnr'] || '' : '',
            accountNumber: person ? person['Bankkonto'] || '' : '',
            breakdown: breakdown
        };

        salaryPersons.push(salaryPerson);
    });

    return salaryPersons;
}

export async function fullSalaryProcess(organizationId, options = {}) {
    //take all salarys that are not pushed to fortnox
    const salaries = await collectUnpushedSalaries(organizationId);

    console.log('\n=== SALARY REPORT ===');
    console.log(`Organization: ${organizationId}`);
    console.log(`Total employees: ${salaries.length}\n`);
    
    salaries.forEach((salary, index) => {
        console.log(`\n--- Employee ${index + 1} ---`);
        console.log(`Name: ${salary.employeeName}`);
        console.log(`Email: ${salary.employeeEmail}`);
        console.log(`Employee ID: ${salary.employeeId}`);
        console.log(`\nBreakdown (${salary.breakdown.length} items):`);
        salary.breakdown.forEach((item, i) => {
            console.log(`  ${i + 1}. ${item.description}: ${item.quantity} × ${item.amount} = ${item.quantity * item.amount} kr`);
            if (item.dateMonth) console.log(`     Month: ${item.dateMonth}`);
            if (item.costCenter) console.log(`     Cost Center: ${item.costCenter}`);
        });
        console.log(`\nBase Salary: ${salary.baseSalary.toFixed(2)} kr`);
        console.log(`Holiday Pay (12%): ${salary.semesterersattning.toFixed(2)} kr`);
        console.log(`Tax: -${salary.skatt.toFixed(2)} kr`);
        console.log(`NET SALARY TO PAY: ${salary.totalSalary.toFixed(2)} kr`);
        console.log(`\nEmployer costs:`);
        console.log(`Social Fees: ${salary.socialaAvgifter.toFixed(2)} kr`);
        console.log(`TOTAL COST: ${(salary.baseSalary + salary.semesterersattning + salary.socialaAvgifter).toFixed(2)} kr`);
        console.log(`\nBank details:`);
        console.log(`Clearing: ${salary.clearingNumber}`);
        console.log(`Account: ${salary.accountNumber}`);
    });

    console.log('\n=== END REPORT ===\n');

    // Create bank file if requested
    if (options.createBankFile && options.organizationIBAN) {
        console.log('\n=== CREATING BANK FILE ===\n');
        const bankFileResult = await createHandelsbankenBankFile(salaries, {
            organizationName: options.organizationName || organizationId,
            organizationIBAN: options.organizationIBAN,
            organizationBIC: options.organizationBIC,
            executionDate: options.executionDate,
            outputPath: options.outputPath
        });
        
        console.log(`✓ Bank file created: ${bankFileResult.filename}`);
        console.log(`✓ Total amount: ${bankFileResult.totalAmount.toFixed(2)} SEK`);
        console.log(`✓ Number of transactions: ${bankFileResult.transactionCount}`);
        console.log(`✓ Execution date: ${bankFileResult.executionDate}`);
        
        if (options.outputPath) {
            console.log(`✓ Saved to: ${options.outputPath}/${bankFileResult.filename}`);
        }
        
        console.log('\n=== END BANK FILE ===\n');
        
        return { salaries, bankFile: bankFileResult };
    }

    //get an object with everyones salarys. Push to database
    // TODO: Save these salary calculations to database

    return { salaries };
}

// Placeholder functions for future implementation
export function createSkatteverketFile() {
    // TODO: Implement tax authority file generation
}

export function pushToFortnox() {
    // TODO: Implement push to Fortnox
}

export function sendEmail() {
    // TODO: Implement email sending
}

// Test execution: run with `node salaryService.js`
// Make sure your .env file has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
if (import.meta.url === `file://${process.argv[1]}`) {
    const testOptions = {
        createBankFile: true,
        organizationName: 'Test Förening',
        organizationIBAN: 'SE1234567890123456789012', // Example IBAN
        organizationBIC: 'HANDSESS', // Handelsbanken BIC
        outputPath: './output'
    };
    
    fullSalaryProcess('Test', testOptions)
        .then((result) => {
            console.log('\n✅ Salary processing completed successfully');
            if (result.bankFile) {
                console.log('\n📄 Bank file XML preview (first 500 chars):');
                console.log(result.bankFile.xml.substring(0, 500) + '...\n');
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Error processing salaries:', error.message);
            console.error(error);
            process.exit(1);
        });
}