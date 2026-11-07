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
    month: { earnings: '84 300 ₽', orders: '271', online: '148 ч 35 мин', trend: '+6% к прошлому месяцу' }
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
    '<p>Бонусы в демоверсии не являются денежными средствами и не начисляются реальным курьерам.</p><p>Условия показаны только для проверки интерфейса.</p>'
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
    'Барори Парк v1.2',
    '<p>Демонстрационная Telegram Mini App. Не подключена к Яндексу, CRM или платёжным системам.</p>'
  ));

  sheetClose.addEventListener('click', closeSheet);
  sheetBackdrop.addEventListener('click', closeSheet);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeSheet(); });
  telegram?.BackButton?.onClick(closeSheet);

  if (telegram) {
    telegram.ready();
    telegram.expand();
    telegram.setHeaderColor?.('bg_color');
    telegram.setBackgroundColor?.('bg_color');
    const firstName = telegram.initDataUnsafe?.user?.first_name;
    if (firstName) document.getElementById('profile-name').textContent = firstName;
  }
})();
