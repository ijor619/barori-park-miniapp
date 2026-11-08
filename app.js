(() => {
  'use strict';

  const telegram = window.Telegram?.WebApp;
  const views = [...document.querySelectorAll('.view')];
  const navButtons = [...document.querySelectorAll('.nav-button')];
  const periodButtons = [...document.querySelectorAll('.period-button')];
  const sheet = document.getElementById('bottom-sheet');
  const sheetBackdrop = document.getElementById('sheet-backdrop');
  const sheetContent = document.getElementById('sheet-content');
  const sheetClose = document.getElementById('sheet-close');
  const toast = document.getElementById('toast');
  let toastTimer;
  let previousFocus = null;

  const stats = {
    today: { earnings: '3 650 ₽', orders: '12', online: '6 ч 20 мин', trend: '+8% к вчера' },
    week: { earnings: '21 480 ₽', orders: '68', online: '37 ч 10 мин', trend: '+12% к прошлой неделе' },
    month: { earnings: '84 300 ₽', orders: '223', online: '148 ч 35 мин', trend: '+6% к прошлому месяцу' }
  };

  const bonusProgram = {
    completedOrders: 223,
    eligibleEarnings: 84300,
    parkCommissionPercent: 3,
    tiers: [
      { min: 0, max: 99, percent: 0, label: '0–99' },
      { min: 100, max: 149, percent: 0.5, label: '100–149' },
      { min: 150, max: 199, percent: 1, label: '150–199' },
      { min: 200, max: 249, percent: 2, label: '200–249' },
      { min: 250, max: Infinity, percent: 3, label: '250+' }
    ]
  };

  function haptic(type = 'light') {
    telegram?.HapticFeedback?.impactOccurred(type);
  }

  function showView(name) {
    views.forEach((view) => {
      const active = view.dataset.view === name;
      view.hidden = !active;
      view.classList.toggle('is-active', active);
    });
    navButtons.forEach((button) => {
      const active = button.dataset.target === name;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    document.getElementById('app').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    haptic();
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2400);
  }

  function openSheet(title, body) {
    previousFocus = document.activeElement;
    sheetContent.innerHTML = `<h3 id="sheet-title">${title}</h3>${body}`;
    sheetBackdrop.hidden = false;
    sheet.hidden = false;
    sheetClose.focus();
    telegram?.BackButton?.show();
    haptic('medium');
  }

  function closeSheet() {
    if (sheet.hidden) return;
    sheet.hidden = true;
    sheetBackdrop.hidden = true;
    telegram?.BackButton?.hide();
    previousFocus?.focus?.();
  }

  function setPeriod(period) {
    const next = stats[period];
    if (!next) return;
    document.getElementById('earnings').textContent = next.earnings;
    document.getElementById('orders-count').textContent = next.orders;
    document.getElementById('online-time').textContent = next.online;
    document.getElementById('trend').textContent = next.trend;
    periodButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.period === period));
    haptic();
  }

  function formatPercent(value) {
    return String(value).replace('.', ',') + '%';
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value) + ' ₽';
  }

  function renderBonusProgram() {
    const { completedOrders, eligibleEarnings, parkCommissionPercent, tiers } = bonusProgram;
    const currentIndex = tiers.findIndex((tier) => completedOrders >= tier.min && completedOrders <= tier.max);
    const current = tiers[currentIndex];
    const effectivePercent = Math.min(current.percent, parkCommissionPercent);
    const cashbackAmount = Math.round(eligibleEarnings * effectivePercent) / 100;
    const next = tiers[currentIndex + 1];
    const remaining = next ? Math.max(0, next.min - completedOrders) : 0;
    const progress = Math.min(100, (completedOrders / tiers[tiers.length - 1].min) * 100);

    document.getElementById('bonus-amount').textContent = formatMoney(cashbackAmount);
    document.getElementById('bonus-preview-amount').textContent = formatMoney(cashbackAmount);
    document.getElementById('bonus-base').textContent = formatMoney(eligibleEarnings);
    document.getElementById('bonus-percent').textContent = formatPercent(effectivePercent);
    document.getElementById('bonus-progress-bar').style.width = progress + '%';
    document.getElementById('bonus-next-level').textContent = next
      ? completedOrders + ' заказов · ещё ' + remaining + ' до ' + formatPercent(next.percent)
      : completedOrders + ' заказов · максимальный уровень достигнут';
    document.getElementById('bonus-preview-progress').textContent = next
      ? formatPercent(effectivePercent) + ' · ещё ' + remaining + ' заказов до ' + formatPercent(next.percent)
      : formatPercent(effectivePercent) + ' · максимальный уровень';

    document.getElementById('bonus-tiers').innerHTML = tiers.map((tier, index) =>
      '<div class="tier-row' + (index === currentIndex ? ' is-current' : '') + '">' +
        '<span>' + tier.label + ' заказов</span>' +
        '<strong>' + formatPercent(Math.min(tier.percent, parkCommissionPercent)) + '</strong>' +
      '</div>'
    ).join('');
  }

  navButtons.forEach((button) => button.addEventListener('click', () => showView(button.dataset.target)));
  document.querySelectorAll('[data-open-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.openView)));
  periodButtons.forEach((button) => button.addEventListener('click', () => setPeriod(button.dataset.period)));

  document.querySelectorAll('[data-order]').forEach((button) => {
    button.addEventListener('click', () => openSheet(
      `Заказ ${button.dataset.order}`,
      '<p>Статус: выполнен</p><p>Это тестовая запись. Адрес клиента, телефон и маршрут намеренно не хранятся.</p>'
    ));
  });

  document.getElementById('bonus-rules').addEventListener('click', () => openSheet(
    'Правила программы',
    '<p>Кэшбэк рассчитывается от суммы завершённых заказов, с которой парк фактически получает комиссию. Чаевые, компенсации и выплаты без комиссии в базу не входят.</p><p>Уровни: 100 заказов — 0,5%, 150 — 1%, 200 — 2%, 250 — 3%. Процент не может превышать фактическую комиссию парка.</p><p>Начисление фиксируется после окончания месяца и доступно для вывода 7 дней. Сейчас показаны демонстрационные данные: реальные выплаты не выполняются.</p>'
  ));

  document.querySelector('[data-action="notifications"]').addEventListener('click', () => {
    const state = document.getElementById('notifications-state');
    const enabled = state.textContent === 'Включены';
    state.textContent = enabled ? 'Выключены' : 'Включены';
    showToast(enabled ? 'Демо-уведомления выключены' : 'Демо-уведомления включены');
    haptic();
  });

  document.querySelector('[data-action="theme"]').addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    document.body.classList.toggle('dark-mode', !isLight);
    document.getElementById('theme-state').textContent = isLight ? 'Светлое' : 'Тёмное';
    showToast(isLight ? 'Включена светлая тема' : 'Включена тёмная тема');
    haptic();
  });

  document.querySelector('[data-action="support"]').addEventListener('click', () => openSheet(
    'Поддержка',
    '<p>Канал поддержки пока не подключён. В рабочей версии сюда будет добавлен безопасный контакт без публикации личных данных.</p>'
  ));

  document.querySelector('[data-action="about"]').addEventListener('click', () => openSheet(
    'Барори Парк v1.3',
    '<p>Демонстрационная Telegram Mini App. Не подключена к Яндексу, CRM или платёжным системам.</p>'
  ));

  sheetClose.addEventListener('click', closeSheet);
  sheetBackdrop.addEventListener('click', closeSheet);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeSheet(); });
  telegram?.BackButton?.onClick(closeSheet);

  renderBonusProgram();

  if (telegram) {
    telegram.ready();
    telegram.expand();
    telegram.setHeaderColor?.('bg_color');
    telegram.setBackgroundColor?.('bg_color');
    const firstName = telegram.initDataUnsafe?.user?.first_name;
    if (firstName) document.getElementById('profile-name').textContent = firstName;
  }
})();
