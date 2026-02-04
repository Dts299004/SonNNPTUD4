const API_URL = 'https://api.escuelajs.co/api/v1/products';

// State
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortConfig = { key: null, direction: 'asc' };

// Elements
const tableBody = document.getElementById('productTableBody');
const searchInput = document.getElementById('searchInput');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const paginationEl = document.getElementById('pagination');

// Modals
const productModal = new bootstrap.Modal(document.getElementById('productModal'));
const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();

    // Event Listeners
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderTable();
    });
});

// --- Data Fetching ---
async function fetchProducts() {
    try {
        // Fetching 200 items to simulate a decent dataset for client-side pagination
        const response = await fetch(`${API_URL}?offset=0&limit=200`);
        if (!response.ok) throw new Error('Failed to fetch data');
        allProducts = await response.json();
        
        // Initial setup
        filteredProducts = [...allProducts];
        renderTable();
    } catch (error) {
        console.error('Error fetching products:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error loading data</td></tr>`;
    }
}

// --- Rendering ---
function renderTable() {
    tableBody.innerHTML = '';
    
    // Pagination slicing
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredProducts.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No products found</td></tr>';
        renderPagination();
        return;
    }

    pageData.forEach(product => {
        const tr = document.createElement('tr');
        
        // Tooltip logic: using 'title' attribute for simple hover description as requested
        tr.setAttribute('title', product.description); 
        tr.setAttribute('data-bs-toggle', 'tooltip'); // Bootstrap tooltip trigger
        tr.setAttribute('data-bs-placement', 'top');

        // Extract first image, fallback if empty array or invalid
        let imgUrl = 'https://via.placeholder.com/50';
        if (product.images && product.images.length > 0) {
             // Clean up potential dirty URLs from the fake API (sometimes they have ["..."])
             let rawUrl = product.images[0];
             if (rawUrl.startsWith('["') && rawUrl.endsWith('"]')) {
                 rawUrl = rawUrl.substring(2, rawUrl.length - 2);
             }
             imgUrl = rawUrl;
        }

        tr.innerHTML = `
            <td>${product.id}</td>
            <td class="fw-bold">${product.title}</td>
            <td>$${product.price}</td>
            <td>${product.category ? product.category.name : 'Unknown'}</td>
            <td><img src="${imgUrl}" alt="${product.title}" class="table-img" onerror="this.src='https://via.placeholder.com/50'"></td>
            <td>
                <button class="btn btn-sm btn-info text-white me-1" onclick="openDetailModal(${product.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    renderPagination();
    
    // Re-initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    })
}

function renderPagination() {
    paginationEl.innerHTML = '';
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    
    // Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" onclick="handlePageChange(${currentPage - 1})">Previous</a>`;
    paginationEl.appendChild(prevLi);

    // Page Numbers (simple logic: show all or restricted range can be added)
    // For simplicity, showing max 5 pages around current
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" onclick="handlePageChange(${i})">${i}</a>`;
        paginationEl.appendChild(li);
    }
    
    // Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" onclick="handlePageChange(${currentPage + 1})">Next</a>`;
    paginationEl.appendChild(nextLi);
}

// --- Actions ---
function handlePageChange(page) {
    if (page < 1 || page > Math.ceil(filteredProducts.length / itemsPerPage)) return;
    currentPage = page;
    renderTable();
}

function handleSearch(query) {
    const lowerQuery = query.toLowerCase();
    filteredProducts = allProducts.filter(p => p.title.toLowerCase().includes(lowerQuery));
    currentPage = 1; // Reset to first page
    // Re-apply sort if exists
    if (sortConfig.key) {
        sortData(sortConfig.key, sortConfig.direction);
    }
    renderTable();
}

function handleSort(key) {
    // Toggle direction
    if (sortConfig.key === key) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.key = key;
        sortConfig.direction = 'asc';
    }
    
    // Update icons
    updateSortIcons(key, sortConfig.direction);
    
    sortData(key, sortConfig.direction);
    renderTable();
}

function sortData(key, direction) {
    filteredProducts.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function updateSortIcons(activeKey, direction) {
    document.getElementById('sort-icon-title').innerHTML = '<i class="fas fa-sort"></i>';
    document.getElementById('sort-icon-price').innerHTML = '<i class="fas fa-sort"></i>';

    const iconHtml = direction === 'asc' ? '<i class="fas fa-sort-up"></i>' : '<i class="fas fa-sort-down"></i>';
    document.getElementById(`sort-icon-${activeKey}`).innerHTML = iconHtml;
}

// --- Export CSV ---
function exportCSV() {
    // Requirements say: "Export data in current view"
    // Interpretation: The data currently visible (pagination page) OR the current filtered list. 
    // Usually, users expect the filtered result, but arguably "current view" could mean just the 10 rows.
    // Let's export the *filtered list* (all pages matching search) as it's more useful.
    
    if (filteredProducts.length === 0) {
        alert("No data to export");
        return;
    }
    
    // CSV Header
    const fields = ['id', 'title', 'price', 'description', 'category_name', 'image_url'];
    const csvRows = [];
    csvRows.push(fields.join(','));

    // CSV Data
    filteredProducts.forEach(item => {
        // Handle commas in text
        const title = `"${item.title.replace(/"/g, '""')}"`; 
        const desc = `"${item.description.replace(/"/g, '""')}"`;
        const catName = item.category ? `"${item.category.name}"` : '""';
        let img = '';
        if (item.images && item.images.length > 0) img = item.images[0];
        
        csvRows.push(`${item.id},${title},${item.price},${desc},${catName},${img}`);
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'products_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Modals & CRUD ---

// Modal State
let isEditing = false;
let currentEditingId = null;

function openCreateModal() {
    isEditing = false;
    currentEditingId = null;
    document.getElementById('productForm').reset();
    document.getElementById('productModalLabel').innerText = 'Create New Product';
    document.getElementById('productId').value = '';
    
    productModal.show();
}

function openDetailModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    // Fill Detail Modal
    document.getElementById('detailTitle').innerText = product.title;
    document.getElementById('detailPrice').innerText = product.price;
    document.getElementById('detailCategory').innerText = product.category ? product.category.name : 'Unknown';
    document.getElementById('detailDescription').innerText = product.description;
    
    let imgUrl = 'https://via.placeholder.com/300';
    if (product.images && product.images.length > 0) {
         let rawUrl = product.images[0];
         // Fix weird array formatting from API if present
         if (rawUrl.startsWith('["') && rawUrl.endsWith('"]')) {
             rawUrl = rawUrl.substring(2, rawUrl.length - 2);
         }
         imgUrl = rawUrl;
    }
    document.getElementById('detailImage').src = imgUrl;

    // Setup Edit Button
    const btnEdit = document.getElementById('btnEditFromDetail');
    btnEdit.onclick = () => {
        detailModal.hide();
        openEditModal(product);
    };

    detailModal.show();
}

function openEditModal(product) {
    isEditing = true;
    currentEditingId = product.id;
    
    document.getElementById('productTitle').value = product.title;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productCategoryId').value = product.category ? product.category.id : 1;
    
    // Handle Image URL input
    let imgUrl = '';
    if (product.images && product.images.length > 0) {
         let rawUrl = product.images[0];
         if (rawUrl.startsWith('["') && rawUrl.endsWith('"]')) {
             rawUrl = rawUrl.substring(2, rawUrl.length - 2);
         }
         imgUrl = rawUrl;
    }
    document.getElementById('productImage').value = imgUrl;

    document.getElementById('productModalLabel').innerText = `Edit Product #${product.id}`;
    productModal.show();
}

async function handleSave() {
    const title = document.getElementById('productTitle').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const description = document.getElementById('productDescription').value;
    const categoryId = parseInt(document.getElementById('productCategoryId').value);
    const imageUrl = document.getElementById('productImage').value;

    if (!title || !price || !description || !imageUrl) {
        alert("Please fill all fields");
        return;
    }

    const payload = {
        title,
        price,
        description,
        categoryId,
        images: [imageUrl]
    };

    const url = isEditing ? `${API_URL}/${currentEditingId}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Failed to save product');
        }

        const savedProduct = await response.json();
        
        // Optimistic UI Update (or refetch)
        // For simplicity with client-side state, we might just update our local array
        // However, if the API returns the full object with category, that's great.
        // The API actually returns the object structure.
        
        if (isEditing) {
            // Update local item
            const index = allProducts.findIndex(p => p.id === currentEditingId);
            if (index !== -1) {
                // Merge response over existing. Note: API response might have different category structure 
                // than what we have in allProducts (nested object vs id).
                // We'll rely on the simple refresh or fetch, but let's try to be smooth.
                allProducts[index] = { ...allProducts[index], ...savedProduct };
                alert("Product updated successfully!");
            }
        } else {
            // Add new item
            allProducts.unshift(savedProduct); // Add to top
            alert("Product created successfully!");
        }

        // Reset Filter/Sort logic to include new data
        handleSearch(searchInput.value); // Re-applies filters

        productModal.hide();
        
    } catch (error) {
        console.error("Error saving:", error);
        alert("Error saving: " + error.message);
    }
}
