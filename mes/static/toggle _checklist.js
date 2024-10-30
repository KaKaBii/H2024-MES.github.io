let currentSortColumn = null;
let currentSortOrder = 'asc';

function toggleSort(n) {
    if (currentSortColumn === n) {
        // Toggle sort order if the same column is clicked
        currentSortOrder = (currentSortOrder === 'asc') ? 'desc' : 'asc';
    } else {
        // Set sort order to ascending if a new column is clicked
        currentSortColumn = n;
        currentSortOrder = 'asc';
    }

    const table = document.getElementById("checktable");
    const rows = Array.from(table.rows).slice(1);

    rows.sort((rowA, rowB) => {
        const cellA = rowA.cells[n].innerText;
        const cellB = rowB.cells[n].innerText;

        if (isNaN(cellA) || isNaN(cellB)) {
            return (currentSortOrder === 'asc')
                ? cellA.localeCompare(cellB)
                : cellB.localeCompare(cellA);
        } else {
            return (currentSortOrder === 'asc')
                ? cellA - cellB
                : cellB - cellA;
        }
    });

    rows.forEach(row => table.appendChild(row));
    updateArrows();
}

function updateArrows() {
    const arrows = document.querySelectorAll('.sort-arrow');
    arrows.forEach(arrow => {
        arrow.className = 'sort-arrow'; // Reset all arrows
    });

    if (currentSortColumn !== null) {
        const columnArrow = document.getElementById(['tablenameArrow', 'credateArrow'][currentSortColumn]);
        columnArrow.classList.add(currentSortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
    }
}