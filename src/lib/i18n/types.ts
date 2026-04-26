export interface Dictionary {
  common: {
    loading: string;
    saving: string;
    creating: string;
    cancel: string;
    save: string;
    saveChanges: string;
    edit: string;
    delete: string;
    remove: string;
    add: string;
    close: string;
    back: string;
    error: string;
    success: string;
    noData: string;
    notLoggedIn: string;
    invoice: string; // "Фактура" default doc type
    date: string;
    email: string;
    password: string;
    status: string;
    actions: string;
    month: string;
    year: string;
    never: string;
    days: string; // "дни"
    day: string; // "ден"
    expired: string;
    noExpiry: string;
    generating: string;
    syncing: string;
    checkNow: string;
    files: string;
    file: string;
    registered: string;
    awaitingRegistration: string;
    protocols: string;
    invoices: string;
  };

  sidebar: {
    dashboard: string;
    protocols: string;
    emails: string;
    navigation: string;
    addInvoice: string;
    admin: string;
    settings: string;
    support: string;
    startFreeTrial: string;
    trialDaysRemaining: string; // "{days} {dayWord} remaining from trial"
  };

  header: {
    dashboard: string;
    newProtocol: string;
    invoices: string;
    addInvoice: string;
    settings: string;
    admin: string;
    details: string;
    bulk: string;
    email: string;
  };

  protocols: {
    title: string;
    subtitle: string;
    newProtocol: string;
    noProtocols: string;
    noProtocolsHint: string;
    protocolNumber: string; // "Протокол №{n}"
    // Table headers
    number: string;
    type: string;
    supplier: string;
    date: string;
    received: string;
    paid: string;
    invoiceCount: string;
    // Types
    typeEU: string;
    typeNonEU: string;
    typeMixed: string;
    typeCommission: string;
    typeStandard: string;
    // Type with rate
    typeEURate: string; // "в ЕС (20%)"
    typeNonEURate: string; // "извън ЕС (0%)"
    typeCommissionOption: string; // "За комисиона"
    typeMixedOption: string; // "Смесен"
    // Form labels
    protocolData: string;
    selectSupplier: string;
    selectSupplierDefault: string;
    supplierAutoFillHint: string;
    supplierName: string;
    supplierNamePlaceholder: string;
    vatId: string;
    vatIdPlaceholder: string;
    creationDate: string;
    taxEventDate: string;
    protocolType: string;
    taxRate: string;
    taxRatePerInvoiceHint: string;
    destination: string;
    destinationPlaceholder: string;
    referenceNumber: string;
    linkedProtocol: string;
    createdBy: string;
    approvedBy: string;
    // Buttons
    createProtocol: string;
    // Sections
    sectionA: string;
    sectionB: string;
    commission: string;
    // Upsell
    upsellTitle: string;
    upsellText: string;
    upsellCTA: string;
    upsellNote: string;
    // Toasts
    toastNotLoggedIn: string;
    toastSaveError: string;
    toastSaveInvoicesError: string;
    toastUpdated: string;
    toastNoSubscription: string;
    toastCreateError: string;
    toastCreated: string;
    // Error
    errorLoading: string;
    // New protocol page
    newProtocolSubtitle: string;
    // Detail page - add invoices
    addInvoices: string;
    addInvoice: string;
  };

  invoiceTable: {
    noInvoices: string;
    seqNumber: string;
    documentType: string;
    documentNumber: string;
    issueDate: string;
    counterpartyId: string;
    vatRate: string;
    amountEUR: string;
    totalReceived: string;
    totalPaid: string;
    totalCommission: string;
    // Edit mode short headers
    type: string;
    docNumber: string;
    date: string;
    counterparty: string;
    vatPercent: string;
    amount: string;
    addRow: string;
  };

  vat: {
    title: string;
    servicesEU: string;
    servicesNonEU: string;
    margin: string;
    taxBase: string;
    taxRate: string;
    vatAmount: string;
  };

  invoices: {
    addTitle: string;
    addSubtitle: string;
    bulkTitle: string;
    bulkSubtitle: string;
    // Steps
    step1: string;
    step2: string;
    step3: string;
    // Upload
    uploadTitle: string;
    uploadDescription: string;
    dragActive: string;
    dragIdle: string;
    pdfOnly: string;
    // Extracting
    extracting: string;
    pleaseWait: string;
    // Extracted
    extractedTitle: string;
    extractedDescription: string;
    documentNumber: string;
    issueDate: string;
    amountEUR: string;
    counterpartyVatId: string;
    counterpartyPlaceholder: string;
    // Settings
    settingsTitle: string;
    protocol: string;
    selectProtocol: string;
    invoiceType: string;
    income: string; // "Приходна (Раздел А - получени суми)"
    expense: string; // "Разходна (Раздел Б - платени суми)"
    commissionType: string;
    vatRate: string;
    vatEU: string;
    vatNonEU: string;
    // Bulk
    pdfFiles: string;
    pdfFilesDescription: string;
    dragActiveBulk: string;
    dragIdleBulk: string;
    multiFileHint: string;
    scanning: string;
    saved: string;
    scanAndSave: string;
    done: string;
    invoicesAdded: string;
    viewProtocol: string;
    // Upsell
    upsellTitle: string;
    upsellText: string;
    upsellCTA: string;
    upsellNote: string;
    // Toasts
    toastUploadPdf: string;
    toastExtractError: string;
    toastExtracted: string;
    toastUnknownError: string;
    toastSelectProtocol: string;
    toastAmountZero: string;
    toastNotLoggedIn: string;
    toastSaveError: string;
    toastAdded: string;
    toastPdfOnly: string;
    toastBulkAdded: string;
    toastBulkPartial: string;
  };

  export: {
    // Excel protocol labels
    protocol: string;
    supplier: string;
    identificationCode: string;
    number: string;
    toProtocolNumber: string;
    creationDate: string;
    taxEventDate: string;
    basedOnDocuments: string;
    touristService: string;
    withReference: string;
    weComposedProtocol: string;
    sectionATitle: string;
    seqNumber: string;
    documentType: string;
    documentNumber: string;
    issueDate: string;
    counterpartyId: string;
    amountEUR: string;
    totalReceived: string;
    sectionBTitle: string;
    totalPaid: string;
    commissionTitle: string;
    commissionInvoiceNumber: string;
    commissionDate: string;
    commissionAmountEUR: string;
    totalCommission: string;
    sectionCTitle: string;
    margin: string;
    taxBase: string;
    taxRatePercent: string;
    vatAmount: string;
    legalArticle: string;
    createdBy: string;
    approvedBy: string;
  };

  marginReport: {
    month: string;
    year: string;
    generating: string;
    report: string;
    // Excel headers
    seqNumber: string;
    protocolNumber: string;
    destination: string;
    taxBase: string;
    vatPercent: string;
    vat: string;
    taxPeriod: string;
    totalSum: string;
    // Toasts
    toastInvalidPeriod: string;
    toastNotLoggedIn: string;
    toastLoadError: string;
    toastNoProtocols: string;
    toastDownloaded: string;
    toastUnexpectedError: string;
  };

  overview: {
    title: string;
    subtitle: string;
    protocolsCard: string;
    protocolsDescription: string;
    invoicesCard: string;
    invoicesDescription: string;
    receivedCard: string;
    receivedDescription: string;
    paidCard: string;
    paidDescription: string;
    unlimitedAccess: string;
    unlimitedNote: string;
  };

  auth: {
    title: string;
    loginTab: string;
    registerTab: string;
    emailLabel: string;
    passwordLabel: string;
    forgotPassword: string;
    loginButton: string;
    registerButton: string;
    // Reset password
    newPassword: string;
    newPasswordDescription: string;
    newPasswordLabel: string;
    confirmPassword: string;
    changePassword: string;
    passwordChanged: string;
    passwordMinLength: string;
    passwordMismatch: string;
    // Toasts
    toastInvalidCredentials: string;
    toastRegisterError: string;
    toastCheckEmail: string;
    toastAccountCreated: string;
    toastNowLogin: string;
    toastServerError: string;
    toastEnterEmail: string;
    toastResetSent: string;
  };

  settings: {
    title: string;
    subtitle: string;
    subscription: string;
    currentPlan: string;
    // Plans
    starterPlan: string;
    businessPlan: string;
    popular: string;
    starterPrice: string;
    businessPrice: string;
    starterFeature1: string;
    starterFeature2: string;
    businessFeature1: string;
    businessFeature2: string;
    aiFeature: string;
    startTrial: string;
    trialNote: string;
    // Status
    trialStatus: string;
    activeStatus: string;
    activeUntil: string;
    manageSubscription: string;
    cancelingWarning: string;
    cancelingNote: string;
    // Account
    account: string;
    emailLabel: string;
    logout: string;
    // Toasts
    toastCheckoutError: string;
    toastNetworkError: string;
  };

  admin: {
    title: string;
    subtitle: string;
    betaTesters: string;
    emailLabel: string;
    period: string;
    addButton: string;
    noBetaTesters: string;
    // Table
    usage: string;
    expires: string;
    // Status
    registered: string;
    awaitingRegistration: string;
    protocolCount: string;
    invoiceCount: string;
    daysRemaining: string;
    // All users
    allUsers: string;
    noUsers: string;
    registration: string;
    // Subscription status
    active: string;
    trial: string;
    pastDue: string;
    canceled: string;
    canceling: string;
    noSubscription: string;
    adminBadge: string;
    // Periods
    period1m: string;
    period3m: string;
    period6m: string;
    period1y: string;
  };

  emailPage: {
    title: string;
    subtitle: string;
    invoicesTab: string;
    accountsTab: string;
    fileCounter: string;
    fullRescan: string;
    fullRescanTooltip: string;
    noAttachments: string;
    noAttachmentsHint: string;
    addToProtocol: string;
    addAccount: string;
    noAccounts: string;
    lastSync: string;
    autoSync: string;
    noDate: string;
    unknownSender: string;
    // Connect dialog
    connectTitle: string;
    step1of2: string;
    step2of2: string;
    chooseProvider: string;
    // Providers
    gmailDesc: string;
    mailbgDesc: string;
    outlookDesc: string;
    yahooDesc: string;
    thunderbirdDesc: string;
    otherDesc: string;
    gmailLabel: string;
    mailbgLabel: string;
    outlookLabel: string;
    yahooLabel: string;
    thunderbirdLabel: string;
    otherLabel: string;
    // Provider-specific
    gmailWarning: string;
    mailbgInfo: string;
    outlookInfo: string;
    yahooWarning: string;
    thunderbirdGuide: string;
    // Form fields
    emailAddress: string;
    emailPlaceholder: string;
    emailHint: string;
    appPassword: string;
    regularPassword: string;
    gmailPasswordHint: string;
    serverAddress: string;
    serverHint: string;
    port: string;
    portHint: string;
    connectionType: string;
    starttls: string;
    ssltls: string;
    seeInThunderbird: string;
    connectAccount: string;
    // Add to protocol dialog
    downloadingFile: string;
    extractingData: string;
    docNumber: string;
    dateLabel: string;
    amountLabel: string;
    protocolLabel: string;
    selectProtocol: string;
    invoiceTypeLabel: string;
    incomeOption: string;
    expenseOption: string;
    vatRateLabel: string;
    vatEU: string;
    vatNonEU: string;
    cancelButton: string;
    addButton: string;
    // Toasts
    toastLoadAccountsError: string;
    toastLoadAttachmentsError: string;
    toastAddError: string;
    toastAccountAdded: string;
    toastAccountAddError: string;
    toastEnterServer: string;
    toastAccountConnected: string;
    toastConnectError: string;
    toastAccountDeleted: string;
    toastDeleteError: string;
    toastNewAttachments: string;
    toastNoNewAttachments: string;
    toastSyncError: string;
    toastSelectProtocol: string;
    toastNotLoggedIn: string;
    toastSaveError: string;
    toastInvoiceAdded: string;
    toastExtractError: string;
    toastConnectionError: string;
    toastDownloadError: string;
  };

  print: {
    protocolTitle: string;
    legalArticleStandard: string;
    legalArticleCommission: string;
    supplierLabel: string;
    vatIdLabel: string;
    creationDateLabel: string;
    taxEventDateLabel: string;
    referenceLabel: string;
    destinationLabel: string;
    linkedProtocolLabel: string;
    sectionATitle: string;
    documentType: string;
    documentNumber: string;
    issueDate: string;
    counterpartyId: string;
    vatPercent: string;
    amountEUR: string;
    totalReceived: string;
    sectionBTitle: string;
    totalPaid: string;
    commissionTitle: string;
    commissionInvoiceNumber: string;
    commissionDate: string;
    commissionAmountEUR: string;
    totalCommission: string;
    sectionCTitle: string;
    marginLabel: string;
    taxBaseLabel: string;
    taxRateLabel: string;
    vatLabel: string;
    createdByLabel: string;
    approvedByLabel: string;
    printButton: string;
    closeButton: string;
  };

  plans: {
    free: string;
    starter: string;
    business: string;
    admin: string;
  };

  trial: {
    title: string;
    subtitle: string;
    starterPrice: string;
    businessPrice: string;
    feature1Starter: string;
    feature2Starter: string;
    feature1Business: string;
    feature2Business: string;
    aiFeature: string;
    startTrial: string;
    popular: string;
    trialNote: string;
    // Toasts
    toastCheckoutError: string;
  };

  successHandler: {
    activating: string;
    toastBusinessActivated: string;
    toastStarterActivated: string;
    toastActivating: string;
  };
}
