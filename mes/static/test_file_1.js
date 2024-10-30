document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Please select an Excel file.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Send data to the server
        fetch('/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: jsonData })
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                appendToTable(result.data);
            } else {
                alert('Failed to upload data');
            }
        });
    };

    reader.readAsArrayBuffer(file);
});

function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}/${month}/${day}`;
}

function formatTime(time) {
    const d = new Date(`1970-01-01T${time}Z`);
    const hours = ('0' + d.getUTCHours()).slice(-2);
    const minutes = ('0' + d.getUTCMinutes()).slice(-2);
    return `${hours}:${minutes}`;
}

function appendToTable(data) {
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');

    const existingRowCount = tableBody.rows.length;

    // Create table header if not exists
    if (existingRowCount === 0) {
        const headerRow = document.createElement('tr');
        const indexHeader = document.createElement('th');
        indexHeader.textContent = 'No';
        headerRow.appendChild(indexHeader);

        data[0].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);
    }

    // Append new data to table body
    data.slice(1).forEach((row, rowIndex) => {
        const tableRow = document.createElement('tr');
        const indexCell = document.createElement('td');
        indexCell.textContent = existingRowCount + rowIndex + 1;
        tableRow.appendChild(indexCell);

        row.forEach((cell, index) => {
            const td = document.createElement('td');

            // Check the header to determine if the cell is a date or time
            const header = data[0][index].toLowerCase();
            if (header.includes('date') && cell) {
                const formattedDate = formatDate(cell);
                td.textContent = formattedDate;
            } else if (header.includes('time') && cell) {
                const formattedTime = formatTime(cell);
                td.textContent = formattedTime;
            } else {
                td.textContent = cell;
            }

            tableRow.appendChild(td);
        });
        tableBody.appendChild(tableRow);
    });
}
