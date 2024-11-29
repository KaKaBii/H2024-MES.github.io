function handleAddMaintenanceClick() {
    const accordionContent = document.getElementById('accordion_create_maintenance');
    if (!accordionContent.classList.contains('show')) {
        accordionContent.classList.add('show');
    }
    resetMaintenanceTable();
    document.getElementById('maintenanceTableName').value = '';
}

function resetMaintenanceTable() {
    const previewTableBody = document.getElementById('maintenanceItemTable').getElementsByTagName('tbody')[0];
    previewTableBody.innerHTML = '';
}

function toggleMaintenanceAccordion() {
    const accordionContent = document.getElementById('accordion-maintenance-content');
    if (accordionContent.classList.contains('active')) {
        accordionContent.classList.remove('active');
        clearMaintenanceForm();
    } else {
        accordionContent.classList.add('active');
        document.getElementById('maintenanceItemName').focus();
    }
}

function clearMaintenanceForm() {
    document.getElementById('maintenanceItemName').value = '';
    document.getElementById('maintenanceDescription').value = '';
    document.getElementById('maintenanceMethod').value = '';
    document.getElementById('maintenanceEstimatedHours').value = '';
}

function saveMaintenanceItem() {
    const itemName = document.getElementById('maintenanceItemName').value;
    const description = document.getElementById('maintenanceDescription').value;
    const method = document.getElementById('maintenanceMethod').value;
    const estimatedHours = document.getElementById('maintenanceEstimatedHours').value;

    if (itemName && description && method && estimatedHours !== '') {
        const tableBody = document.getElementById('maintenanceItemTable').getElementsByTagName('tbody')[0];
        const newRow = tableBody.insertRow();
        newRow.insertCell(0).textContent = itemName;
        newRow.insertCell(1).textContent = description;
        newRow.insertCell(2).textContent = method;
        newRow.insertCell(3).textContent = estimatedHours;

        clearMaintenanceForm();
        toggleMaintenanceAccordion();
    } else {
        alert('請填寫所有必填項目。');
    }
}
