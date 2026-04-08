// ==================== CONFIGURATION GLOBALE ====================
const API_BASE_URL = 'http://localhost:8080/banqueApp';
let clients = [];
//bonjour 

let loans = [];
let currentStep = 1;
let currentClientId = null;
let currentLoanProcess = {
    client: null,
    loan: null
};

// ==================== INITIALISATION ====================
window.onload = function() {
    loadAllData();
};

function loadAllData() {
    Promise.all([
        getClientsFromServer(),
        getLoansFromServer()
    ]).then(() => {
        initApp();
    }).catch(error => {
        console.error('Erreur chargement initial:', error);
        alert('Erreur lors du chargement des données');
    });
}

function initApp() {

    initEventListeners();
    renderClientsTable();
    renderLoansTable();
    updateStats();
    populateExistingClients();
    setupClientSelection();

    // Toujours afficher la section clients au démarrage
    setTimeout(() => {
        showSection('clients-section');
        setActiveMenu(document.getElementById('menu-clients'));
    }, 100);
}
// ==================== GESTION DES ÉVÉNEMENTS ====================
function initEventListeners() {
    // Navigation sidebar
    const menuItems = {
        'menu-clients': 'clients-section',
        'menu-loans': 'loans-section',
        'menu-new-loan-process': 'new-loan-process-section',
        'menu-add-loan': 'add-loan-section'
    };
    
    Object.entries(menuItems).forEach(([menuId, sectionId]) => {
        const element = document.getElementById(menuId);
        if (element) {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                showSection(sectionId);
                setActiveMenu(this);
            });
        }
    });
    
    // Boutons dans la section clients
    attachEventIfExists('add-client-btn', 'click', showAddClientModal);
    attachEventIfExists('search-client-btn', 'click', () => {
        document.getElementById('client-search').focus();
    });
    attachEventIfExists('new-loan-process-btn', 'click', function() {
        resetNewLoanProcess();
        showSection('new-loan-process-section');
        setActiveMenu(document.getElementById('menu-new-loan-process'));
    });
    
    // Recherche et filtres
    attachEventIfExists('client-search', 'input', function() {
        filterClients(this.value);
    });
    attachEventIfExists('loan-status-filter', 'change', function() {
        filterLoansByStatus(this.value);
    });
    
    // Boutons de retour
    ['back-to-clients', 'back-to-main', 'back-to-main-2'].forEach(btnId => {
        attachEventIfExists(btnId, 'click', function() {
            showSection('clients-section');
            setActiveMenu(document.getElementById('menu-clients'));
        });
    });
    
    // Processus de nouvelle demande de prêt
    attachEventIfExists('next-to-step-2', 'click', goToStep2);
    attachEventIfExists('back-to-step-1', 'click', goToStep1);
    attachEventIfExists('next-to-step-3', 'click', goToStep3);
    attachEventIfExists('back-to-step-2', 'click', goToStep2FromStep3);
    attachEventIfExists('calculate-monthly', 'click', calculateMonthlyPayment);
    attachEventIfExists('reject-loan', 'click', rejectLoan);
    attachEventIfExists('approve-loan', 'click', approveLoan);
    
    // Ajouter un prêt à un client existant
    attachEventIfExists('calculate-existing-monthly', 'click', calculerMensualiteExistante);
    attachEventIfExists('calculate-existing-risk', 'click', calculateExistingRisk);
    attachEventIfExists('reject-existing-loan', 'click', rejectExistingLoan);
    attachEventIfExists('approve-existing-loan', 'click', approveExistingLoan);
    
    // Modals
    attachEventIfExists('save-new-client', 'click', saveNewClient);
    attachEventIfExists('save-edit-client', 'click', saveEditedClient);
    attachEventIfExists('save-edit-loan', 'click', saveEditedLoan);
    
    // Toggle sidebar pour mobile
    attachEventIfExists('sidebarCollapse', 'click', function() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('content').classList.toggle('active');
    });
}

function attachEventIfExists(elementId, eventType, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(eventType, handler);
    }
}

// ==================== FONCTIONS D'AFFICHAGE ====================
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }
}

function setActiveMenu(menuElement) {
    document.querySelectorAll('#sidebar a').forEach(menu => {
        menu.classList.remove('active');
    });
    if (menuElement) {
        menuElement.classList.add('active');
    }
}

// ==================== FONCTIONS CLIENTS ====================
function showAddClientModal() {
    document.getElementById('add-client-form').reset();
    const modal = new bootstrap.Modal(document.getElementById('addClientModal'));
    modal.show();
}

function saveNewClient() {
    const lastName = document.getElementById('new-client-lastname').value;
    const firstName = document.getElementById('new-client-firstname').value;
    const city = document.getElementById('new-client-city').value;
    const zipCode = document.getElementById('new-client-zipcode').value;
    const monthlyIncome = parseFloat(document.getElementById('new-client-income').value);

    if (!lastName || !firstName || !city || !zipCode || !monthlyIncome) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }

    addClientToDB(lastName, firstName, city, zipCode, monthlyIncome);
}

 async function addClientToDB(lastName, firstName, city, zipCode, monthlyIncome) {
    const newClient = { 
        Nom: lastName, 
        Prenom: firstName, 
        Ville: city, 
        Cd_postal: zipCode, 
        Revenue: monthlyIncome 
    };

    try {
        const response = await fetch(`${API_BASE_URL}/client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClient)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de l\'ajout du client');
        }

        const createdClient = await response.json();
        
        alert('Client ajouté avec succès !');
        const modal = bootstrap.Modal.getInstance(document.getElementById('addClientModal'));
        if (modal) modal.hide();
        
        // Ajouter le client à la liste et rafraîchir
        clients.push(createdClient);
        renderClientsTable();
        updateStats();
        populateExistingClients();
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ajout du client: ' + error.message);
    }
}

async function getClientsFromServer() {
    try {
         const response = await fetch(`${API_BASE_URL}/client`); // <-- c’est ici
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        clients = await response.json();
        console.log("clients :" , clients[0])  ; 
        return clients;
    } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
        throw error;
    }
}
 
async function getClientById(clientId) {
    try {
        const response = await fetch(`${API_BASE_URL}/client?id=${clientId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        return await response.json();
    } catch (error) {
        console.error('Erreur récupération client:', error);
        return null;
    }
}

function filterClients(searchTerm) {
    const filteredClients = clients.filter(client => {
        const fullName = `${client.Nom} ${client.Prenom}`.toLowerCase();
        const city = (client.Ville || '').toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) || 
               city.includes(searchTerm.toLowerCase()) ||
               (client.Cd_postal || '').includes(searchTerm);
    });
    
    renderClientsTable(filteredClients);
}

function renderClientsTable(clientsToRender = clients) {
    const tbody = document.getElementById('clients-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    clientsToRender.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.Nom || ''}</td>
            <td>${client.Prenom || ''}</td>
            <td>${client.Ville || ''}</td>
            <td>${client.Cd_postal || ''}</td>
            <td>${formatCurrency(client.Revenue || 0)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action edit-client-btn" data-id="${client.Id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-action delete-client-btn" data-id="${client.Id}">
                    <i class="bi bi-trash"></i>
                </button>
                <button class="btn btn-sm btn-outline-info btn-action client-loans-btn" data-id="${client.Id}">
                    <i class="bi bi-clock-history"></i> Détails Prêts
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    attachClientEventListeners();
}

function attachClientEventListeners() {
    document.querySelectorAll('.edit-client-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = parseInt(this.getAttribute('data-id'));
            showEditClientModal(clientId);
        });
    });
    
    document.querySelectorAll('.delete-client-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = parseInt(this.getAttribute('data-id'));
            deleteClient(clientId);
        });
    });
    
    document.querySelectorAll('.client-loans-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = parseInt(this.getAttribute('data-id'));
            showClientLoansDetails(clientId);
        });
    });
}

function showEditClientModal(clientId) {
    const client = clients.find(c => c.Id === clientId);
    if (!client) return;
    
    document.getElementById('edit-client-id').value = client.Id;
    document.getElementById('edit-client-lastname').value = client.Nom || '';
    document.getElementById('edit-client-firstname').value = client.Prenom || '';
    document.getElementById('edit-client-city').value = client.Ville || '';
    document.getElementById('edit-client-zipcode').value = client.Cd_postal || '';
    document.getElementById('edit-client-income').value = client.Revenue || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editClientModal'));
    modal.show();
}

async function saveEditedClient() {
    const clientId = parseInt(document.getElementById('edit-client-id').value);
    const lastName = document.getElementById('edit-client-lastname').value;
    const firstName = document.getElementById('edit-client-firstname').value;
    const city = document.getElementById('edit-client-city').value;
    const zipCode = document.getElementById('edit-client-zipcode').value;
    const monthlyIncome = parseFloat(document.getElementById('edit-client-income').value);
    
    if (!lastName || !firstName || !city || !zipCode || isNaN(monthlyIncome)) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    const clientIndex = clients.findIndex(c => c.Id === clientId); 
    if (clientIndex === -1) {
        alert('Client non trouvé');
        return;
    }
    
    const updatedClient = {
        Id: clientId,
        Nom: lastName,
        Prenom: firstName,
        Ville: city,
        Cd_postal: zipCode,
        Revenue: monthlyIncome
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/client`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedClient)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la modification');
        }
        
        const result = await response.json();
        
        // Mettre à jour le client localement
        clients[clientIndex] = result;
        
        renderClientsTable();
        updateStats();
        populateExistingClients();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editClientModal'));
        if (modal) modal.hide();
        
        alert(`Client ${result.Prenom} ${result.Nom} modifié avec succès.`);
        
    } catch (error) {
        console.error("Erreur:", error);
        alert("Impossible de sauvegarder les modifications: " + error.message);
    }
}

async function deleteClient(clientId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action supprimera également tous ses prêts.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/client?id=${clientId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la suppression');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Supprimer le client et ses prêts dans le front-end
            clients = clients.filter(client => client.Id !== clientId);
            loans = loans.filter(loan => loan.ClientId !== clientId);
            
            // Mettre à jour l'affichage
            renderClientsTable();
            renderLoansTable();
            updateStats();
            populateExistingClients();
            
            alert('Client supprimé avec succès.');
        } else {
            alert('Erreur lors de la suppression du client.');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression du client: ' + error.message);
    }
}

// ==================== FONCTIONS PRÊTS ====================
async function getLoansFromServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/pret`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        loans = await response.json();
        console.log("la liste des prets : " , loans[0]) ; 
        return loans;
    } catch (error) {
        console.error("Erreur chargement prêts:", error.message);
        throw error;
    }
}

async function getLoansByClientId(clientId) {
    try {
        const response = await fetch(`${API_BASE_URL}/pret?clientId=${clientId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        return await response.json();
    } catch (error) {
        console.error("Erreur chargement prêts client:", error.message);
        return [];
    }
}

function renderLoansTable(loansToRender = loans) {
    const tbody = document.getElementById('loans-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    loansToRender.forEach(loan => {
        const client = clients.find(c => c.Id === loan.ClientId);
        const clientName = client ? `${client.Nom} ${client.Prenom}` : 'Client inconnu';
        
        const agreementDate = loan.DateAccord ? formatDate(loan.DateAccord) : '—';
        const endDate = loan.DateFin ? formatDate(loan.DateFin) : '—';
        
        let statusClass = '';
        if (loan.statut === 'En_cours') statusClass = 'badge-en-cours';
        else if (loan.statut === 'Refuse') statusClass = 'badge-refuse';
        else if (loan.statut === 'Rembourse') statusClass = 'badge-rembourse';
        
        let riskClass = '';
        if (loan.niveauRisque === 'Faible') riskClass = 'risk-low';
        else if (loan.niveauRisque === 'Eleve' || loan.niveauRisque === 'Élevé') riskClass = 'risk-high';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${loan.Id || ''}</td>
            <td>${clientName}</td>
            <td>${loan.typePret || ''}</td>
            <td>${formatCurrency(loan.MontantPret || 0)}</td>
            <td>${loan.Duree || ''}</td>
            <td>${loan.TauxAnnuel || 0}%</td>
            <td>${formatCurrency(loan.Mensualite || 0)}</td>
            <td class="${riskClass}">${loan.niveauRisque || 'Non calculé'}</td>
            <td><span class="badge-status ${statusClass}">${loan.statut || 'Inconnu'}</span></td>
            <td>${agreementDate}</td>
            <td>${endDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary btn-action edit-loan-btn" data-id="${loan.Id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning btn-action calculate-risk-btn" data-id="${loan.Id}">
                    <i class="bi bi-exclamation-triangle"></i>
                </button>
                <button class="btn btn-sm btn-outline-info btn-action loan-history-btn" data-id="${loan.Id}">
                    <i class="bi bi-clock-history"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    attachLoanEventListeners();
}

function attachLoanEventListeners() {
    document.querySelectorAll('.edit-loan-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const loanId = parseInt(this.getAttribute('data-id'));
            showEditLoanModal(loanId);
        });
    });
    
    document.querySelectorAll('.calculate-risk-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const loanId = parseInt(this.getAttribute('data-id'));
            calculateLoanRisk(loanId);
        });
    });
    
    document.querySelectorAll('.loan-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const loanId = parseInt(this.getAttribute('data-id'));
            const loan = loans.find(l => l.Id === loanId);
            if (loan) {
                showClientLoansDetails(loan.ClientId);
            }
        });
    });
}

function filterLoansByStatus(statut) {
    const filteredLoans = statut ? loans.filter(loan => loan.Statut === statut) : loans;
    renderLoansTable(filteredLoans);
}

function showEditLoanModal(loanId) {
    const loan = loans.find(l => l.Id === loanId);
    if (!loan) return;
    
    document.getElementById('edit-loan-id').value = loan.Id;
    document.getElementById('edit-loan-type').value = loan.TypePret || '';
    document.getElementById('edit-loan-amount').value = loan.MontantPret || '';
    document.getElementById('edit-loan-duration').value = loan.Duree || '';
    document.getElementById('edit-loan-rate').value = loan.TauxAnnuel || '';
    document.getElementById('edit-loan-status').value = loan.Statut || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editLoanModal'));
    modal.show();
}

async function saveEditedLoan() {
    const loanId = parseInt(document.getElementById('edit-loan-id').value);
    const type = document.getElementById('edit-loan-type').value;
    const amount = parseFloat(document.getElementById('edit-loan-amount').value);
    const duration = parseInt(document.getElementById('edit-loan-duration').value);
    const annualRate = parseFloat(document.getElementById('edit-loan-rate').value);
    const status = document.getElementById('edit-loan-status').value;
    
    if (!type || isNaN(amount) || isNaN(duration) || isNaN(annualRate) || !status) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    const loan = loans.find(l => l.Id === loanId);
    if (!loan) {
        alert('Prêt non trouvé');
        return;
    }
    
    const updatedLoan = {
        Id: loanId,
        TypePret: type,
        MontantPret: amount,
        Duree: duration,
        TauxAnnuel: annualRate,
        Statut: status,
        NiveauRisque: loan.NiveauRisque,
        ClientId: loan.ClientId
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/pret`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedLoan)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la modification');
        }
        
        const result = await response.json();
        
        // Mettre à jour le prêt localement
        const loanIndex = loans.findIndex(l => l.Id === loanId);
        if (loanIndex !== -1) {
            loans[loanIndex] = result;
        }
        
        renderLoansTable();
        updateStats();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editLoanModal'));
        if (modal) modal.hide();
        
        alert(`Prêt #${result.Id} modifié avec succès.`);
        
    } catch (error) {
        console.error("Erreur:", error);
        alert("Impossible de sauvegarder les modifications: " + error.message);
    }
}

async function calculateLoanRisk(loanId) {
    const loan = loans.find(l => l.Id === loanId);
    if (!loan) return;
    
    const client = clients.find(c => c.Id === loan.ClientId);
    if (!client) return;
    
    const debtRatio = (loan.Mensualite / client.Revenue) * 100;
    const riskLevel = determineRiskLevel(debtRatio);
    
    alert(`Risque du prêt #${loanId}:\n\n` +
          `Mensualité: ${formatCurrency(loan.Mensualite)}\n` +
          `Revenu client: ${formatCurrency(client.Revenue)}\n` +
          `Taux d'endettement: ${debtRatio.toFixed(2)}%\n` +
          `Niveau de risque: ${riskLevel}`);
}

// ==================== DÉTAILS PRÊTS CLIENT ====================
async function showClientLoansDetails(clientId) {
    try {
        const client = clients.find(c => c.Id === clientId);
        if (!client) {
            alert('Client non trouvé');
            return;
        }
        // console.log(client.Nom) ; 
        const clientLoans = await getLoansByClientId(clientId);
        // Mettre à jour le titre
        const titleElement = document.querySelector('#client-loans-details-section .page-header h2');
        if (titleElement) {
            titleElement.innerHTML = 
                `<i class="bi bi-clock-history me-2"></i>Historique des Prêts - ${client.Prenom} ${client.Nom}`;
        }
        
        // Afficher les prêts en cours
        const currentLoans = clientLoans.filter(loan => loan.statut === 'En_cours');

        const currentLoansList = document.getElementById('current-loans-list');
        if (currentLoansList) {
            currentLoansList.innerHTML = '';
            
            if (currentLoans.length === 0) {
                currentLoansList.innerHTML = '<p class="text-muted text-center">Aucun prêt en cours</p>';
            } else {
                currentLoans.forEach(loan => {
                    const loanElement = document.createElement('div');
                    loanElement.className = 'mb-3 pb-3 border-bottom';
                    loanElement.innerHTML = `
                        <h6>${loan.typePret} - ${formatCurrency(loan.MontantPret)}</h6>
                        <p class="mb-1 small">ID: ${loan.Id} | Durée: ${loan.Duree} mois</p>
                        <p class="mb-1 small">Mensualité: ${formatCurrency(loan.Mensualite)}</p>
                        <p class="mb-0 small">Date accord: ${formatDate(loan.DateAccord)}</p>
                    `;
                    currentLoansList.appendChild(loanElement);
                });
            }
        }
        
        // Afficher la section
        showSection('client-loans-details-section');
        setActiveMenu(null);
        
    } catch (error) {
        console.error('Erreur détails prêts client:', error);
        alert('Erreur lors du chargement des détails des prêts');
    }
}

// ==================== PROCESSUS NOUVEAU PRÊT ====================
function resetNewLoanProcess() {
    currentStep = 1;
    currentLoanProcess = {
        client: null,
        loan: null
    };
    
    // Réinitialiser les indicateurs
    const indicators = ['step-1-indicator', 'step-2-indicator', 'step-3-indicator'];
    indicators.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('completed', 'active');
            if (index === 0) element.classList.add('active');
        }
    });
    
    // Réinitialiser les formulaires
    ['client-info-form', 'loan-info-form'].forEach(formId => {
        const form = document.getElementById(formId);
        if (form) form.reset();
    });
    
    // Cacher les résultats
    const calculationResult = document.getElementById('monthly-calculation-result');
    if (calculationResult) calculationResult.style.display = 'none';
    
    // Désactiver le bouton Suivant
    const nextButton = document.getElementById('next-to-step-3');
    if (nextButton) nextButton.disabled = true;
    
    // Afficher l'étape 1
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    const step1 = document.getElementById('step-1');
    if (step1) step1.classList.add('active');
}

function goToStep2() {
    const lastName = document.getElementById('client-lastname').value;
    const firstName = document.getElementById('client-firstname').value;
    const city = document.getElementById('client-city').value;
    const zipCode = document.getElementById('client-zipcode').value;
    const monthlyIncome = document.getElementById('client-income').value;
    
    if (!lastName || !firstName || !city || !zipCode || !monthlyIncome) {
        alert('Veuillez remplir tous les champs obligatoires de l\'étape 1.');
        return;
    }
    
    currentLoanProcess.client = {
        lastName,
        firstName,
        city,
        zipCode,
        monthlyIncome: parseFloat(monthlyIncome)
    };
    
    // Mettre à jour les indicateurs
    const step1Indicator = document.getElementById('step-1-indicator');
    const step2Indicator = document.getElementById('step-2-indicator');
    if (step1Indicator) {
        step1Indicator.classList.remove('active');
        step1Indicator.classList.add('completed');
    }
    if (step2Indicator) step2Indicator.classList.add('active');
    
    // Changer d'étape
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    if (step1) step1.classList.remove('active');
    if (step2) step2.classList.add('active');
    
    currentStep = 2;
}

function goToStep1() {
    const step1Indicator = document.getElementById('step-1-indicator');
    const step2Indicator = document.getElementById('step-2-indicator');
    if (step2Indicator) step2Indicator.classList.remove('active');
    if (step1Indicator) {
        step1Indicator.classList.add('active');
        step1Indicator.classList.remove('completed');
    }
    
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    if (step2) step2.classList.remove('active');
    if (step1) step1.classList.add('active');
    
    currentStep = 1;
}

function calculateMonthlyPayment() {

    const amount = parseFloat(document.getElementById('loan-amount').value);
    const duration = parseInt(document.getElementById('loan-duration').value);
    const annualRate = parseFloat(document.getElementById('loan-rate').value);
    const revenu = parseFloat(document.getElementById("client-income").value) ; 

    if (!amount || !duration || !annualRate) {
        alert('Veuillez remplir tous les champs du prêt avant de calculer.');
        return;
    }

    // Vérifier qu'un client est sélectionné
    if (!currentLoanProcess.client) {
        alert('Veuillez sélectionner un client avant de calculer la mensualité.');
        return;
    }


    // Appel API pour calculer la mensualité et le risque
    calculerMensualiteAPI(amount, annualRate, duration, revenu)
        .then(result => {
            document.getElementById('calculated-monthly').textContent = formatCurrency(result.mensualite);
            console.log(result.mensualite) ; 
            document.getElementById('monthly-calculation-result').style.display = 'block';

            // Stocker le prêt en cours
            currentLoanProcess.loan = {
                type: document.getElementById('loan-type').value,
                amount,
                duration,
                annualRate,
                mensualite: result.mensualite,
                score_risque: result.score_risque,
                decision: result.decision
            };

            // Activer le bouton Suivant
            document.getElementById('next-to-step-3').disabled = false;
        })
        .catch(error => {
            alert('Erreur lors du calcul de la mensualité: ' + error.message);
        });
}

// Fonction API pour calculer mensualité + risque
async function calculerMensualiteAPI(montant, taux, duree, revenu) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/pret?action=calculerMensualite&montant=${montant}&taux=${taux}&duree=${duree}&revenu=${revenu}`
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur de calcul');
        }

        const data = await response.json();

        return {
            mensualite: data.mensualite,
            score_risque: data.score_risque,
            decision: data.decision
        };
    } catch (error) {
        console.warn('Calcul côté serveur échoué, utilisation du calcul côté client');
        return {
            mensualite: calculerMensualiteLocale(montant, taux, duree),
            score_risque: null,
            decision: null
        };
    }
}




function goToStep3() {
    if (!currentLoanProcess.loan || !currentLoanProcess.loan.mensualite) {
        alert('Veuillez d\'abord calculer la mensualité.');
        return;
    }
    
    // Mettre à jour les indicateurs
    const step2Indicator = document.getElementById('step-2-indicator');
    const step3Indicator = document.getElementById('step-3-indicator');
    if (step2Indicator) {
        step2Indicator.classList.remove('active');
        step2Indicator.classList.add('completed');
    }
    if (step3Indicator) step3Indicator.classList.add('active');
    
    // Changer d'étape
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    if (step2) step2.classList.remove('active');
    if (step3) step3.classList.add('active');
    
    // Mettre à jour le résumé
    document.getElementById('risk-client-name').textContent = 
        `${currentLoanProcess.client.firstName} ${currentLoanProcess.client.lastName}`;
    document.getElementById('risk-client-income').textContent = 
        formatCurrency(currentLoanProcess.client.monthlyIncome);
    document.getElementById('risk-loan-type').textContent = currentLoanProcess.loan.type;
    document.getElementById('risk-loan-amount').textContent = formatCurrency(currentLoanProcess.loan.amount);
    document.getElementById('risk-loan-duration').textContent = `${currentLoanProcess.loan.duration} mois`;
    document.getElementById('risk-loan-rate').textContent = `${currentLoanProcess.loan.annualRate} %`;
    
    // Calculer et afficher l'analyse de risque
    const monthlyPayment = currentLoanProcess.loan.mensualite;
    const debtRatio = (monthlyPayment / currentLoanProcess.client.monthlyIncome) * 100;
    const riskLevel = determineRiskLevel(debtRatio);
    
    document.getElementById('risk-monthly').textContent = formatCurrency(monthlyPayment);
    document.getElementById('risk-debt-ratio').textContent = `${debtRatio.toFixed(2)} %`;
    document.getElementById('risk-level').textContent = riskLevel;
    
    const riskElement = document.getElementById('risk-level');
    if (riskElement) {
        riskElement.className = '';
        if (riskLevel === 'Faible') riskElement.classList.add('risk-low');
        else if (riskLevel === 'Moyen') riskElement.classList.add('risk-medium');
        else if (riskLevel === 'Élevé') riskElement.classList.add('risk-high');
    }
    
    currentStep = 3;
}

function goToStep2FromStep3() {
    const step3Indicator = document.getElementById('step-3-indicator');
    const step2Indicator = document.getElementById('step-2-indicator');
    if (step3Indicator) step3Indicator.classList.remove('active');
    if (step2Indicator) step2Indicator.classList.add('active');
    
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    if (step3) step3.classList.remove('active');
    if (step2) step2.classList.add('active');
    
    currentStep = 2;
}

function rejectLoan() {
    if (!confirm('Êtes-vous sûr de vouloir refuser ce prêt ?')) {
        return;
    }
    
    alert('Prêt refusé. Le client n\'a pas été enregistré dans le système.');
    showSection('clients-section');
    setActiveMenu(document.getElementById('menu-clients'));
}

async function approveLoan() {
    if (!confirm('Êtes-vous sûr de vouloir accorder ce prêt et enregistrer le client ?')) {
        return;
    }
    
    try {
        // 1. Créer le client d'abord
        const newClient = {
            Id : currentLoanProcess.client.Id, 
            Nom: currentLoanProcess.client.lastName,
            Prenom: currentLoanProcess.client.firstName,
            Ville: currentLoanProcess.client.city,
            Cd_postal: currentLoanProcess.client.zipCode,
            Revenue: currentLoanProcess.client.monthlyIncome
        };
        
        const clientResponse = await fetch(`${API_BASE_URL}/client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClient)
        });
        
        if (!clientResponse.ok) {
            const errorData = await clientResponse.json();
            throw new Error('Erreur création client: ' + (errorData.error || 'Erreur inconnue'));
        }
        
        const createdClient = await clientResponse.json();
        
        // Calculer le risque
        const debtRatio = (currentLoanProcess.loan.mensualite / currentLoanProcess.client.monthlyIncome) * 100;
        const riskLevel = determineRiskLevel(debtRatio);
        
        // 2. Créer le prêt avec l'ID du client
        const newLoan = {
            ClientId: createdClient.Id,
            typePret: currentLoanProcess.loan.type,
            MontantPret: currentLoanProcess.loan.amount,
            Duree: currentLoanProcess.loan.duration,
            TauxAnnuel: currentLoanProcess.loan.annualRate,
            Mensualite: currentLoanProcess.loan.mensualite,
            niveauRisque: riskLevel,
            statut: "En_cours"
        };
        
        const loanResponse = await fetch(`${API_BASE_URL}/pret`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLoan)
        });
        
        if (!loanResponse.ok) {
            const errorData = await loanResponse.json();
            throw new Error('Erreur création prêt: ' + (errorData.error || 'Erreur inconnue'));
        }
        
        const createdLoan = await loanResponse.json();
        
        // Recharger les données
        await loadAllData();
        
        alert(`Prêt accordé avec succès !\n\n` +
              `Client: ${createdClient.Prenom} ${createdClient.Nom}\n` +
              `Montant: ${formatCurrency(createdLoan.MontantPret)}\n` +
              `Mensualité: ${formatCurrency(createdLoan.Mensualite)}\n` +
              `Niveau de risque: ${createdLoan.NiveauRisque}`);
        
        showSection('clients-section');
        setActiveMenu(document.getElementById('menu-clients'));
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la création du prêt : ' + error.message);
    }
}

// ==================== AJOUTER UN PRÊT À UN CLIENT EXISTANT ====================
function populateExistingClients() {
    const select = document.getElementById('existing-client');
    if (!select) return;
    
    select.innerHTML = '<option value="">Sélectionnez un client</option>';
    
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.Id;
        option.textContent = `${client.Nom} ${client.Prenom} - ${client.Ville} (${client.Cd_postal})`;
        select.appendChild(option);
    });
}

function setupClientSelection() {
    const select = document.getElementById('existing-client');
    if (!select) return;

    select.addEventListener('change', () => {
        const clientId = parseInt(select.value);
        if (!clientId) {
            currentLoanProcess.client = null;
            return;
        }
        currentLoanProcess.client = clients.find(c => c.Id === clientId);
        console.log('Client sélectionné:', currentLoanProcess.client);
    });
}
async function calculerMensualiteExistante() {
    const amount = parseFloat(document.getElementById('existing-loan-amount').value);
    const annualRate = parseFloat(document.getElementById('existing-loan-rate').value);
    const duration = parseInt(document.getElementById('existing-loan-duration').value);

    if (!amount || !annualRate || !duration) {
        alert('Veuillez remplir tous les champs avant de calculer.');
        return;
    }

    // Récupérer le client courant pour envoyer le Revenue
    const client = clients.find(c => c.Id === currentLoanProcess.client?.Id);
    if (!client) {
        console.log('currentLoanProcess.client =', currentLoanProcess.client);
        alert('Client introuvable');
        return;
    }

    try {
        // Appel API pour récupérer la mensualité et le risque
        const result = await calculerMensualiteAPI(amount, annualRate, duration, client.Revenue);

        // Affichage du résultat
        document.getElementById('existing-calculation-result').style.display = 'block';
        const element = document.getElementById('existing-calculated-monthly');
        element.textContent = formatCurrency(result.mensualite);
        const element2 = document.getElementById('existing-debt-ratio'); 
        element2.textContent = result.score_risque ;
        console.log(element2); 
        const riskElement = document.getElementById('existing-risk-level') ; 
        riskElement.textContent = result.decision ; 
       if (riskElement) {
            riskElement.className = '';
            if (result.decision === 'RISQUE_FAIBLE') riskElement.textContent = 'Faible' , riskElement.classList.add('risk-low');
            else if (result.decision === 'RISQUE_ELEVE') riskElement.textContent = 'Eleve' , riskElement.classList.add('risk-high');
        }    

        // Stocker les infos dans des data-attributes pour réutilisation
        element.dataset.mensualite = result.mensualite;
        element2.dataset.scoreRisque = result.score_risque ?? '';
        riskElement.dataset.decision = result.decision ?? '';

    } catch (error) {
        alert('Erreur lors du calcul de la mensualité: ' + error.message);
    }
}


async function calculateExistingRisk() {
    const clientId = parseInt(document.getElementById('existing-client').value);
    const amount = parseFloat(document.getElementById('existing-loan-amount').value);
    const duration = parseInt(document.getElementById('existing-loan-duration').value);
    const annualRate = parseFloat(document.getElementById('existing-loan-rate').value);
    
    if (!clientId || !amount || !duration || !annualRate) {
        alert('Veuillez remplir tous les champs avant de calculer le risque.');
        return;
    }
    
    const client = clients.find(c => c.Id === clientId);
    if (!client) {
        alert('Client non trouvé');
        return;
    }
    
    try {
        // Calculer la mensualité
        const mensualite = await calculerMensualiteAPI(amount, annualRate, duration);
        
        // Calculer le taux d'endettement
        const debtRatio = (mensualite / client.Revenue) * 100;
        const riskLevel = determineRiskLevel(debtRatio);
        
        // Afficher les résultats
        document.getElementById('existing-calculated-monthly').textContent = formatCurrency(mensualite);
        document.getElementById('existing-debt-ratio').textContent = `${debtRatio.toFixed(2)} %`;
        document.getElementById('existing-risk-level').textContent = riskLevel;
        
        // Appliquer la classe de couleur
        const riskElement = document.getElementById('existing-risk-level');
        if (riskElement) {
            riskElement.className = '';
            if (riskLevel === 'Faible') riskElement.classList.add('risk-low');
            else if (riskLevel === 'Élevé') riskElement.classList.add('risk-high');
        }
        
        document.getElementById('existing-calculation-result').style.display = 'block';
        
        // Stocker la mensualité
        const mensualiteElement = document.getElementById('existing-calculated-monthly');
        mensualiteElement.dataset.mensualite = mensualite;
        
    } catch (error) {
        alert('Erreur lors du calcul du risque: ' + error.message);
    }
}

async function rejectExistingLoan() {
    const clientId = parseInt(document.getElementById('existing-client').value);
    const type = document.getElementById('existing-loan-type').value;
    const amount = parseFloat(document.getElementById('existing-loan-amount').value);
    
    if (!clientId || !type || !amount) {
        alert('Veuillez sélectionner un client et remplir les informations du prêt.');
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir refuser ce prêt ?')) {
        return;
    }
    
    const duration = parseInt(document.getElementById('existing-loan-duration').value);
    const annualRate = parseFloat(document.getElementById('existing-loan-rate').value);
    
    // Calculer la mensualité
    let mensualite = 0;
    const mensualiteElement = document.getElementById('existing-calculated-monthly');
    if (mensualiteElement && mensualiteElement.dataset.mensualite) {
        mensualite = parseFloat(mensualiteElement.dataset.mensualite);
    } else {
        mensualite = calculerMensualiteLocale(amount, annualRate, duration);
    }
    
    const client = clients.find(c => c.Id === clientId);
    const debtRatio = client ? (mensualite / client.Revenue) * 100 : 0;
    const riskLevel = determineRiskLevel(debtRatio);
    
    const newLoan = {
        ClientId: clientId,
        typePret: type,
        MontantPret: amount,
        Duree: duration,
        TauxAnnuel: annualRate,
        Mensualite: mensualite,
        niveauRisque: riskLevel,
        statut: "Refuse"
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/pret`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newLoan)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
        }
        
        const createdLoan = await response.json();
        
        // Ajouter localement
        loans.push(createdLoan);
        
        // Mettre à jour l'affichage
        renderLoansTable();
        updateStats();
        
        // Réinitialiser le formulaire
        document.getElementById('add-loan-form').reset();
        document.getElementById('existing-calculation-result').style.display = 'none';
        
        alert(`Prêt #${createdLoan.Id} refusé avec succès.\n\n` +
              `Raison: Risque ${riskLevel.toLowerCase()} (taux d'endettement: ${debtRatio.toFixed(2)}%)`);
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du refus du prêt: ' + error.message);
    }
}

async function approveExistingLoan() {
    const clientId = parseInt(document.getElementById('existing-client').value);
    const type = document.getElementById('existing-loan-type').value;
    console.log(type) ; 
    const amount = parseFloat(document.getElementById('existing-loan-amount').value);
    const duration = parseInt(document.getElementById('existing-loan-duration').value);
    const annualRate = parseFloat(document.getElementById('existing-loan-rate').value);
    
    // Récupérer la mensualité calculée
    let mensualite = 0;
    const mensualiteElement = document.getElementById('existing-calculated-monthly');
    if (mensualiteElement && mensualiteElement.dataset.mensualite) {
        mensualite = parseFloat(mensualiteElement.dataset.mensualite);
    } else if (mensualiteElement && mensualiteElement.textContent) {
        const text = mensualiteElement.textContent.trim();
        const match = text.match(/[\d,\.]+/);
        if (match) {
            mensualite = parseFloat(match[0].replace(',', '.'));
        }
    }
    
    if (!clientId || !type || !amount || !duration || !annualRate) {
        alert('Veuillez sélectionner un client et remplir toutes les informations du prêt.');
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir accorder ce prêt ?')) return;
    
    // Calculer le risque
    const client = clients.find(c => c.Id === clientId);
    const debtRatio = client ? (mensualite / client.Revenue) * 100 : 0;
    const riskLevel = determineRiskLevel(debtRatio);
    
    const loanData = {
        ClientId: clientId,
        typePret: type,
        MontantPret: amount,
        Duree: duration,
        TauxAnnuel: annualRate,
        Mensualite: mensualite,
        niveauRisque: riskLevel,
        statut: "En_cours"
    };

    try {
        const response = await fetch(`${API_BASE_URL}/pret`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loanData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
        }
        
        const createdLoan = await response.json();
        
        // Ajouter localement
        loans.push(createdLoan);
        
        // Mettre à jour l'affichage
        renderLoansTable();
        updateStats();
        
        // Réinitialiser le formulaire
        const addLoanForm = document.getElementById('add-loan-form');
        if (addLoanForm) addLoanForm.reset();
        
        const calculationResult = document.getElementById('existing-calculation-result');
        if (calculationResult) calculationResult.style.display = 'none';
        
        alert(`Prêt #${createdLoan.Id} accordé avec succès !\n\n` +
              `Type: ${createdLoan.typePret}\n` +
              `Montant: ${formatCurrency(createdLoan.MontantPret)}\n` +
              `Mensualité: ${formatCurrency(createdLoan.Mensualite)}\n` +
              `Durée: ${createdLoan.Duree} mois\n` +
              `Risque: ${createdLoan.niveauRisque}`);
        
    } catch (error) {
        console.error('Erreur backend:', error);
        alert('Erreur lors de l\'accord du prêt : ' + error.message);
    }
}

// ==================== FONCTIONS UTILITAIRES ====================
function determineRiskLevel(debtRatio) {
    if (debtRatio <= 25) return 'Faible';
    else if (debtRatio <= 33) return 'Moyen';
    else return 'Élevé';
}

function updateClientTotalLoanedAmount(clientId) {
    const clientLoans = loans.filter(loan => loan.ClientId === clientId && loan.Statut !== 'Refuse');
    const totalAmount = clientLoans.reduce((sum, loan) => sum + (loan.MontantPret || 0), 0);
    
    const clientIndex = clients.findIndex(c => c.Id === clientId);
    if (clientIndex !== -1) {
        // Note: L'attribut totalLoanedAmount n'existe pas dans Client
        // On pourrait l'ajouter si nécessaire
    }
}

function updateStats() {
    // Total clients
    const totalClientsElement = document.getElementById('total-clients');
    if (totalClientsElement) totalClientsElement.textContent = clients.length;
    
    // Total prêts actifs
    const activeLoans = loans.filter(loan => loan.Statut === 'En_cours');
    const totalLoansElement = document.getElementById('total-loans');
    if (totalLoansElement) totalLoansElement.textContent = activeLoans.length;
    
    // Montant total prêté
    const totalAmount = loans
        .filter(loan => loan.Statut !== 'Refuse')
        .reduce((sum, loan) => sum + (loan.MontantPret || 0), 0);
    const totalAmountElement = document.getElementById('total-amount');
    if (totalAmountElement) totalAmountElement.textContent = formatCurrency(totalAmount);
    
    // Nombre de risques élevés
    const highRiskLoans = loans.filter(loan => 
        (loan.NiveauRisque === 'Élevé' || loan.NiveauRisque === 'Eleve') && 
        loan.Statut === 'En_cours'
    );
    const highRiskElement = document.getElementById('high-risk');
    if (highRiskElement) highRiskElement.textContent = highRiskLoans.length;
}

function formatCurrency(amount) {
    if (isNaN(amount)) amount = 0;
    return new Intl.NumberFormat('fr-FR', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleDateString('fr-FR');
    } catch (e) {
        return '—';
    }
}

// ==================== GESTION DES ERREURS ====================
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    // Afficher une alerte modale au lieu d'une popup système
    showErrorModal('Une erreur est survenue dans l\'application. Veuillez rafraîchir la page.');
});

function showErrorModal(message) {
    const modalHtml = `
        <div class="modal fade" id="errorModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">Erreur</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Créer et afficher le modal
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
    
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    errorModal.show();
    
    // Nettoyer après fermeture
    document.getElementById('errorModal').addEventListener('hidden.bs.modal', function() {
        modalContainer.remove();
    });
}

// ==================== EXPORT POUR TESTS ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency,
        formatDate,
        determineRiskLevel,
        calculerMensualiteLocale
    };
}
