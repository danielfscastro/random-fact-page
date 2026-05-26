import { displayFact, showLoading, showError, onNewFactRequested } from './pageUI.js';
import { setCallbacks, initialize, requestRandomFact, changeLanguage } from '../controller/factController.js';

// Wire controller callbacks to UI functions
setCallbacks({
  onFact: (factResponse) => displayFact(factResponse),
  onLoading: (isLoading) => { if (isLoading) showLoading(); },
  onError: (message) => showError(message),
});

// Wire the "New Fact" button to request a new fact
onNewFactRequested(() => requestRandomFact());

// Wire language buttons
const langEnBtn = document.getElementById('lang-en');
const langPtBtn = document.getElementById('lang-pt');

if (langEnBtn) {
  langEnBtn.addEventListener('click', () => {
    langEnBtn.classList.add('active');
    langPtBtn.classList.remove('active');
    changeLanguage('en');
  });
}

if (langPtBtn) {
  langPtBtn.addEventListener('click', () => {
    langPtBtn.classList.add('active');
    langEnBtn.classList.remove('active');
    changeLanguage('pt-br');
  });
}

// Show loading indicator immediately and fetch the first fact
showLoading();
initialize();
