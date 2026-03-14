const assistantBody = document.getElementById('assistantBody');
const assistantInput = document.getElementById('assistantInput');
const assistantSend = document.getElementById('assistantSend');

function respondToQuestion() {
  const q = assistantInput.value.trim().toLowerCase();
  if (!q) return;

  const responses = [];
  if (q.includes('login')) responses.push('To login, enter your User ID and Password and click the Login button.');
  if (q.includes('create transaction') || q.includes('triplicate') || q.includes('transaction')) responses.push('Go to Accounts > Transactions and fill the Triplicate Challan Entry form, then Save.');
  if (q.includes('save') || q.includes('saved')) responses.push('Click Save; data is sent to the local server and stored in transactions.json.');
  if (q.includes('accounts')) responses.push('Accounts module manages local financial transactions. Click Transactions to add entries.');
  if (q.includes('payment')) responses.push('Use the Payment Mode field in the transaction form (Cash, Online, Cheque).');

  if (responses.length === 0) {
    assistantBody.textContent = 'I am the Panchayat assistant. You can ask about login, accounts, or transactions.';
  } else {
    assistantBody.textContent = responses.join(' ');
  }
  assistantInput.value = '';
}

if (assistantSend) assistantSend.addEventListener('click', respondToQuestion);
if (assistantInput) assistantInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') respondToQuestion(); });
