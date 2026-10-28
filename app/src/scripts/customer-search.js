// Customer search used by views/partials/customer-search.ejs
// The partial can be included several times, so each search box is set up only once
document.querySelectorAll('[data-customer-search]:not([data-ready])').forEach((root) => {
    root.dataset.ready = '';
    const input = root.querySelector('.customer-search-input');
    const selectedId = root.querySelector('.customer-search-id');
    const list = root.querySelector('.customer-search-list');
    let lastSearch = '';

    const hideList = () => {
        list.innerHTML = '';
        list.classList.remove('is-open');
    };

    const showUsers = (users) => {
        hideList();
        users.forEach((user) => {
            const item = document.createElement('div');
            item.className = 'customer-search-item';
            item.textContent = `${user.id} ${user.login} ${user.kredit} Kč`;
            item.addEventListener('click', () => {
                input.value = user.login;
                selectedId.value = user.id;
                hideList();
            });
            list.appendChild(item);
        });
        list.classList.toggle('is-open', users.length > 0);
    };

    input.addEventListener('input', async () => {
        // Typing again invalidates the previous selection
        selectedId.value = '';
        const searchTerm = input.value.trim().toLowerCase();
        lastSearch = searchTerm;

        if (searchTerm.length < 3) {
            hideList();
            return;
        }

        try {
            const res = await fetch(`/api/users?search=${encodeURIComponent(searchTerm)}`);
            const users = res.ok ? await res.json() : [];
            // Ignore responses that arrive after a newer search was started
            if (searchTerm === lastSearch) {
                showUsers(users);
            }
        } catch (err) {
            hideList();
        }
    });
});
