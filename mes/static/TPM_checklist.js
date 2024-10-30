function handleAddChecklistClick() {
    // 展開新增點檢表的手風琴
    const accordionContent = document.getElementById('accordion_creat');
    if (!accordionContent.classList.contains('show')) {
        accordionContent.classList.add('show');
    }
    resetitemTable();
    // 清空輸入框的內容
    document.getElementById('tableName').value = '';
}

function resetitemTable() {
    // 清空右邊的預覽點檢表
    const previewTableBody = document.getElementById('itemTable').getElementsByTagName('tbody')[0];
    previewTableBody.innerHTML = ''; // 清空表格內容
}


function toggleAccordion() {
    const accordionContent = document.getElementById('accordion-content');
    if (accordionContent.classList.contains('active')) {
        accordionContent.classList.remove('active');
        clearForm();
    } else {
        accordionContent.classList.add('active');
        document.getElementById('itemName').focus();
    }
}

function clearForm() {
    resetForm();
}

function resetForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('description').value = '';
    document.getElementById('inspectionResult').value = '';
    document.getElementById('estimatedHours').value = '';
}

function saveItem() {
    const itemName = document.getElementById('itemName').value;
    const description = document.getElementById('description').value;
    const inspectionResult = document.getElementById('inspectionResult').value;
    const estimatedHours = document.getElementById('estimatedHours').value;


    if (itemName && description && inspectionResult &&estimatedHours !== '') {
        const tableBody = document.getElementById('itemTable').getElementsByTagName('tbody')[0];
        const newRow = tableBody.insertRow();
        newRow.insertCell(0).textContent = itemName;
        newRow.insertCell(1).textContent = description 
        newRow.insertCell(2).textContent = inspectionResult;
        newRow.insertCell(3).textContent = estimatedHours;

        clearForm();
        toggleAccordion();
    } else {
        alert('請填寫所有必填項目。');
    }
}

function saveChecklist() {
    const tableName = document.getElementById('tableName').value.trim();
    if (!tableName) {
        alert('請輸入點檢表名稱。');
        return;
    }

    const tableData = [];
    const rows = document.getElementById('itemTable').getElementsByTagName('tbody')[0].rows;

    for (let i = 0; i < rows.length; i++) {
        const item = {
            itemName: rows[i].cells[0].textContent,
            description: rows[i].cells[1].textContent,
            checkway: rows[i].cells[2].textContent,
            timestamp: rows[i].cells[3].textContent
        };
        tableData.push(item);
    }

    if (tableData.length === 0) {
        alert('請新增至少一個點檢項目。');
        return;
    }

    fetch('/api/get_checktable');

    // 發送 POST 請求到 Flask 伺服器
    fetch('/api/saveChecklist', { // 使用相對路徑，避免硬編碼的主機名稱
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',  // 發送包含憑證的請求
        body: JSON.stringify({ 
            tableName: tableName, 
            items: tableData 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('點檢表儲存成功！');
            // 清空預覽表和表單
            document.getElementById('itemTable').getElementsByTagName('tbody')[0].innerHTML = '';
            document.getElementById('tableName').value = '';
            const accordionContent = document.getElementById('left-indicator_collapseOne');
            accordionContent.classList.remove('show');
            
        } else {
            alert('儲存失敗：' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('儲存過程中發生錯誤。');
    });
}
