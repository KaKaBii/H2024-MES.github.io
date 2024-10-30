document.getElementById('addRowBtn').addEventListener('click', function() {
    var table = document.getElementById('sortableTable').getElementsByTagName('tbody')[0];
    var newRow = table.insertRow(0); // 在表格頂部新增一行

    // 在新行中添加單元格
    newRow.innerHTML = `
        <td></td>
        <td><input type="text" class="form-control" placeholder="Plan"></td>
        <td><input type="text" class="form-control" placeholder="Product"></td>
        <td><input type="number" class="form-control" placeholder="Number"></td>
        <td><input type="text" class="form-control" placeholder="Material"></td>
        <td><input type="date" class="form-control" ></td>
        <td><input type="time" class="form-control"></td>
        <td></td>
    `;
});

document.getElementById('saveBtn').addEventListener('click', async function() {
    var table = document.getElementById('sortableTable').getElementsByTagName('tbody')[0];
    var newRow = table.rows[0];

    // 獲取新行的數據
    var plan = newRow.cells[1].getElementsByTagName('input')[0].value;
    var product = newRow.cells[2].getElementsByTagName('input')[0].value;
    var number = newRow.cells[3].getElementsByTagName('input')[0].value;
    var material = newRow.cells[4].getElementsByTagName('input')[0].value;
    var date = newRow.cells[5].getElementsByTagName('input')[0].value;
    var time = newRow.cells[6].getElementsByTagName('input')[0].value;
    var order = `${plan}${product}${material}`;

    // 彈出確認框
    if(plan && product && number && material && date && time) {
        var confirmation = confirm(`Plan: ${plan}\nProduct: ${product}\nNumber: ${number}\nMaterial: ${material}\nDate: ${date}\nTime: ${time}\nOrder: ${order}\n\n是否確認保存？`);
        if(confirmation) {
            try {
                // 發送數據到後端
                const response = await fetch('/save_workplan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        plan: plan,
                        product: product,
                        number: number,
                        material: material,
                        date: date,
                        time: time,
                        order: order
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    alert('數據已保存到資料庫');

                    // 更新表格中的新行
                    newRow.cells[0].innerText = table.rows.length; // 設置序列號
                    newRow.cells[7].innerText = order; // 設置order
                    
                    // 移除輸入框，將內容設置為不可編輯的文本
                    for(var i = 1; i <= 6; i++) {
                        newRow.cells[i].innerText = newRow.cells[i].getElementsByTagName('input')[0].value;
                    }
                } else {
                    alert('儲存數據時出錯，order已重複，請重新輸入');
                }
            } catch (error) {
                alert('發生錯誤，請稍後再試');
                console.error('Error:', error);
            }
        }
    } else {
        alert('請完整填寫所有欄位');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    fetch('/get_workplan_data')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#sortableTable tbody');
            tableBody.innerHTML = ''; 
            
            data.forEach(row => {
                const tr = document.createElement('tr');

                tr.innerHTML = `
                    <td>${row.id}</td>
                    <td>${row.plan}</td>
                    <td>${row.product}</td>
                    <td>${row.number}</td>
                    <td>${row.material}</td>
                    <td>${row.date}</td>
                    <td>${row.time}</td>
                    <td>${row.order}</td>
                `;

                tableBody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
});
