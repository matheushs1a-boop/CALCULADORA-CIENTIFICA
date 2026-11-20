// A abertura é decorativa. Os eventos continuam chegando ao app durante a exibição.
(() => {
    const chave = 'calclab-abertura';
    const abertura = document.getElementById('abertura');
    const url = new URL(location.href);

    document.addEventListener('click', evento => {
        if (!evento.target.closest('#btn-rever-abertura')) return;
        try { sessionStorage.removeItem(chave); } catch {}
        if (url.searchParams.has('sem-abertura')) {
            const atual = new URL(location.href);
            atual.searchParams.delete('sem-abertura');
            history.replaceState(history.state, '', atual.href);
        }
        location.reload();
    });

    let vista = false;
    try { vista = sessionStorage.getItem(chave) === '1'; } catch {}
    if (!abertura || vista || url.searchParams.has('sem-abertura')) {
        abertura?.remove();
        return;
    }

    let reduzirNoApp = false;
    try { reduzirNoApp = localStorage.getItem('mathlab_reduce_motion') === 'true'; } catch {}
    const reduzida = reduzirNoApp || matchMedia('(prefers-reduced-motion: reduce)').matches;
    abertura.classList.toggle('abertura-reduzida', reduzida);
    abertura.hidden = false;
    try { sessionStorage.setItem(chave, '1'); } catch {}

    const eventos = new AbortController();
    const opcoes = { capture: true, signal: eventos.signal };
    const timer = setTimeout(fechar, reduzida ? 600 : 2000);

    function fechar() {
        clearTimeout(timer);
        eventos.abort();
        abertura.remove();
    }

    window.addEventListener('pointerdown', fechar, opcoes);
    window.addEventListener('keydown', fechar, opcoes);
})();
