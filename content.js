/* Сценарий лекции. Classic script: данные для автономного проигрывателя. */
window.LECTURE = {
  title: 'React и API',
  subtitle: 'От карточки книги к каталогу с живыми данными',
  duration: 70,
  chapters: [
    { id: 'bridge', title: 'От карточки к каталогу', minutes: 4 },
    { id: 'lists', title: 'Списки: map и key', minutes: 8 },
    { id: 'http', title: 'HTTP и fetch', minutes: 11 },
    { id: 'effects', title: 'useEffect и жизненный цикл запроса', minutes: 18 },
    { id: 'states', title: 'Загрузка, ошибки и повтор', minutes: 8 },
    { id: 'api', title: 'Отдельный API слой', minutes: 8 },
    { id: 'middleware', title: 'Axios и middleware', minutes: 5 },
    { id: 'projects', title: 'Семестровый проект: четыре пути', minutes: 8 }
  ],
  slides: [
    {
      id: 'cover', chapter: 'bridge', kicker: 'Лекция 02 · 70 минут + 20 минут практики',
      title: 'React и API', lead: 'В прошлый раз мы собрали карточку. Сегодня дадим каталогу источник данных.',
      layout: 'cover', bullets: ['Массив → список карточек', 'HTTP → данные', 'Эффект → надежный интерфейс'],
      callout: 'Один сквозной пример: книжный магазин.',
      notes: 'Открытие, около 40 секунд. Напомнить знакомый ProductCard: название, автор, цена, кнопка добавления в корзину. Сегодня не начинаем приложение заново: меняем способ получения массива книг и учимся переживать медленную сеть. В конце обязательно вернемся к выбору семестрового проекта; последние восемь минут зарезервированы для четырех архитектур. Практика идет отдельно после 70 минут.'
    },
    {
      id: 'known', chapter: 'bridge', kicker: 'Точка опоры', title: 'Карточка уже умеет показывать книгу',
      lead: 'JSX, props, useState и обработчики событий остаются нашей основой.', layout: 'code',
      code: { file: 'ProductCard.jsx · знакомый компонент', language: 'js', text: `export function ProductCard({ book, onAdd }) {
  return (
    <article>
      <h3>{book.title}</h3>
      <p>{book.author}</p>
      <p>{book.price} ₽</p>
      <button onClick={() => onAdd(book)}>
        В корзину
      </button>
    </article>
  );
}`, highlight: [1, 7] },
      callout: 'Данные приходят через props. Callback передает действие родителю.',
      notes: 'Около 1 минуты. Вопрос аудитории: кто должен хранить общую корзину — каждая карточка или общий родитель? Ожидаемый ответ: общий родитель, карточке передаем callback. Здесь book — объект, но это тот же механизм props, который уже проходили; при старом интерфейсе с отдельными props можно передавать title/author/price по отдельности. Выделить onClick: передаем функцию, а не вызываем onAdd при рендере. Сетевых запросов у карточки не будет.'
    },
    {
      id: 'target', chapter: 'bridge', kicker: 'Цель занятия', title: 'Откуда возьмется массив книг?',
      lead: 'Вместо трех вручную написанных карточек — каталог, который умеет загружаться и восстанавливаться.',
      layout: 'flow', steps: [
        { label: 'API', text: 'Возвращает JSON с книгами' },
        { label: 'Состояние', text: 'Хранит данные, загрузку и ошибку' },
        { label: 'Список', text: 'Создает ProductCard для каждой книги' }
      ],
      callout: 'Вопрос: что пользователь должен увидеть, пока ответ еще не пришел?',
      notes: 'Около 2 минут. Собрать короткие ответы: индикатор загрузки, понятная ошибка, возможность повторить, объяснение пустого результата. Зафиксировать: пустой массив до запроса и пустой массив после успешного ответа имеют разный смысл. Результат занятия — рабочий каталог с поиском и четырьмя состояниями. Для начала временно оставляем данные в коде, чтобы отдельно освоить отображение массива.'
    },
    {
      id: 'books-array', chapter: 'lists', kicker: 'Модель данных', title: 'Одна книга — объект. Каталог — массив.',
      lead: 'Согласуем форму объекта, которую понимает ProductCard.', layout: 'code',
      code: { file: 'books.js', language: 'js', text: `export const books = [
  {
    id: 'b-101',
    title: 'Мастер и Маргарита',
    author: 'Михаил Булгаков',
    price: 690
  },
  {
    id: 'b-102',
    title: 'Пикник на обочине',
    author: 'Аркадий и Борис Стругацкие',
    price: 540
  }
];`, highlight: [3, 9] },
      bullets: ['id обозначает книгу', 'price — число', 'Порядок массива может меняться'],
      notes: 'Около 1,5 минуты. Спросить, что произойдет с ценой при сложении, если сервер прислал строку "690". Не углубляться в типизацию, но установить контракт: число, не готовая строка с рублями. id не связан с текущей позицией книги. Пример содержит стабильные идентификаторы, которые позже вернет API. Не используем название как идентификатор: у разных изданий названия могут совпадать.'
    },
    {
      id: 'map', chapter: 'lists', kicker: 'Массив → JSX', title: 'map создает элемент для каждой книги',
      lead: 'map возвращает новый массив. React может отобразить массив JSX-элементов.', layout: 'code',
      code: { file: 'BookList.jsx', language: 'js', text: `import { ProductCard } from './ProductCard.jsx';

export function BookList({ books, onAdd }) {
  return (
    <section className="book-grid">
      {books.map((book) => (
        <ProductCard
          key={book.id}
          book={book}
          onAdd={onAdd}
        />
      ))}
    </section>
  );
}`, highlight: [6, 8] },
      callout: 'Если callback записан с { }, внутри нужен return.',
      notes: 'Около 2,5 минуты. Пройти выражение слева направо: books — массив, book — текущий объект, callback возвращает карточку, результат map вставляется в JSX через фигурные скобки. Показать типичную ошибку books.map(book => { <ProductCard /> }): получаются undefined, потому что нет return. Вопрос: сколько карточек создаст map для пустого массива? Ноль. onAdd остается общей функцией родителя. Демонстрация: добавить третий объект в массив и увидеть третью карточку без копирования разметки.',
      sources: [{ label: 'React: rendering lists', url: 'https://react.dev/learn/rendering-lists' }]
    },
    {
      id: 'keys', chapter: 'lists', kicker: 'Идентичность элемента', title: 'key отвечает: «это та же книга?»',
      lead: 'При вставке, удалении и сортировке React сопоставляет соседние элементы по ключу.', layout: 'compare',
      cards: [
        { title: 'Стабильный id', text: 'Книга сохраняет ключ при перестановке.', code: 'key={book.id}' },
        { title: 'Индекс массива', text: 'После удаления позиция может принадлежать другой книге.', code: 'key={index}' },
        { title: 'Случайное число', text: 'Новый ключ на каждом рендере приводит к пересозданию элемента.', code: 'key={Math.random()}' }
      ],
      callout: 'key уникален среди соседей. Он не передается компоненту как обычный prop.',
      notes: 'Около 2 минут. На доске: A с индексом 0, B с индексом 1; удалили A, у B стал ключ 0. React может сохранить локальное состояние элемента 0, и отметка или текст окажется у другой книги. Индекс допустим для действительно неизменного списка, но каталог фильтруется и сортируется — нужен id. Если ProductCard нужен идентификатор, он уже есть в book.id; нельзя читать props.key. Ключ ставится на непосредственный элемент, возвращаемый map; если оборачиваем карточку в div, key нужно перенести на этот div.',
      sources: [{ label: 'React: правила ключей', url: 'https://react.dev/learn/rendering-lists#rules-of-keys' }]
    },
    {
      id: 'filter-list', chapter: 'lists', kicker: 'Проверка понимания', title: 'Фильтруем данные, затем рисуем список',
      lead: 'Вычисление списка во время рендера не требует эффекта.', layout: 'code',
      code: { file: 'Catalog.jsx · локальный поиск', language: 'js', text: `const [query, setQuery] = useState('');
const visibleBooks = books.filter((book) =>
  book.title.toLowerCase().includes(query.toLowerCase())
);

return (
  <>
    <input
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      placeholder="Название книги"
    />
    <BookList books={visibleBooks} onAdd={onAdd} />
  </>
);`, highlight: [2, 3, 13] },
      callout: 'Вопрос: нужно ли хранить visibleBooks в отдельном useState?',
      notes: 'Около 2 минут. Ответ: нет, здесь visibleBooks однозначно вычисляется из books и query. Это фрагмент тела Catalog, useState импортирован из React, books и onAdd переданы в props. Подчеркнуть разницу между filter и map: filter отбирает существующие объекты, map превращает их в карточки. Пока поиск локальный. Далее перенесем выборку на сервер, и query станет входом сетевого запроса. Не вводить debounce: это отдельная оптимизация после правильного жизненного цикла.'
    },
    {
      id: 'contract', chapter: 'http', kicker: 'HTTP · контракт', title: 'Договоримся о запросе и ответе',
      lead: 'UI должен знать адрес, метод, параметры, формат данных и смысл статуса.', layout: 'split',
      bullets: ['GET /api/books', 'Параметр q — строка поиска, например «Мастер»', '200: JSON с массивом books', 'Пустой результат: 200 и books: []', 'Ошибка сервера: например, 500'],
      code: { file: 'Ответ GET /api/books', language: 'js', text: `{
  "books": [
    {
      "id": "b-101",
      "title": "Мастер и Маргарита",
      "author": "Михаил Булгаков",
      "price": 690
    }
  ]
}`, highlight: [2, 4, 7] },
      callout: 'JSON содержит данные. Компоненты выбирают, как их показать.',
      notes: 'Около 2 минут. Пояснить GET: получить данные; запись и другие методы будут позже. Пример API учебный, его контракт мы контролируем. Заголовок ответа Content-Type: application/json. Пустой поиск не ошибка. Ошибка может вернуть другой объект, например {error:{code:"BOOKS_UNAVAILABLE",message:"..."}}, но в первом клиенте будем строить сообщение по статусу. Спросить: должен ли API возвращать HTML карточки? Для этого клиента нет — возвращает данные. В реальном проекте заранее зафиксировать типы полей, пагинацию при необходимости и формат ошибок.'
    },
    {
      id: 'async-time', chapter: 'http', kicker: 'Время и сеть', title: 'Ответ приходит позже',
      lead: 'fetch возвращает Promise. await приостанавливает async-функцию до результата.', layout: 'flow',
      steps: [
        { label: 'Запрос', text: 'Браузер отправляет HTTP-запрос' },
        { label: 'Ожидание', text: 'Интерфейс продолжает обрабатывать события' },
        { label: 'Ответ', text: 'Код после await получает Response' },
        { label: 'JSON', text: 'Еще один await читает и разбирает тело' }
      ],
      callout: 'await не превращает сетевой запрос в мгновенную операцию.',
      notes: 'Около 1,5 минуты. Не начинать отдельную лекцию по event loop. Достаточно модели: функция начинает запрос, отдаёт управление, затем продолжает после завершения Promise. fetch сообщает, что получен Response; тело читается отдельно. Медленная сеть — нормальное состояние приложения, поэтому пользователь не должен видеть необъяснимую пустоту. Спросить: можно ли получить готовый массив сразу из fetch(url)? Нет, это Promise<Response>, затем нужен разбор тела.',
      sources: [{ label: 'MDN: Using Fetch', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' }]
    },
    {
      id: 'fetch-basics', chapter: 'http', kicker: 'Первый запрос', title: 'Получаем ответ и читаем JSON',
      lead: 'Для 404 и 500 fetch обычно не отклоняет Promise. Проверяем response.ok.', layout: 'code',
      code: { file: 'Первый getBooks · без жизненного цикла', language: 'js', text: `async function getBooks() {
  const response = await fetch('/api/books');

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  const data = await response.json();
  return data.books;
}`, highlight: [2, 4, 8] },
      bullets: ['ok: статус в диапазоне 200–299', 'json(): Promise с разобранным телом', 'Ошибка сети и ошибка HTTP — разные ситуации'],
      notes: 'Около 2,5 минуты. Это учебная первая версия; getBooks возвращает массив, но пока не проверяет структуру и не принимает поиск/сигнал. Провести мысленный эксперимент: сервер ответил 500, fetch получил корректный HTTP-ответ — значит Promise fetch может успешно выполниться, хотя данные нам не подходят. response.ok становится false, сами бросаем Error. response.json может тоже отклониться, если тело невалидный JSON. 204 не содержит JSON-тела; наш GET-контракт требует 200 с JSON. Не обещать, что любой успешный статус автоматически содержит массив.',
      sources: [{ label: 'MDN: обработка статуса ответа', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_response_status' }]
    },
    {
      id: 'try-catch', chapter: 'http', kicker: 'Путь ошибки', title: 'try / catch обрабатывает отказ',
      lead: 'После ошибки мы выбираем понятное действие для пользователя.', layout: 'code',
      code: { file: 'Учебный запуск из консоли', language: 'js', text: `async function inspectBooks() {
  try {
    const books = await getBooks();
    console.table(books);
  } catch (error) {
    console.error('Не удалось получить книги:', error);
  } finally {
    console.log('Попытка запроса завершена');
  }
}

inspectBooks();`, highlight: [3, 5, 7] },
      callout: 'finally выполняется и после успеха, и после ошибки.',
      notes: 'Около 2 минут. Этот пример запускается один раз вне компонента, чтобы показать JavaScript без React. catch ловит отклонение от await и наш throw после проверки статуса. finally полезен для завершения индикатора загрузки, но позже увидим: устаревший finally нельзя позволять изменять состояние нового запроса. Не утверждать, что catch всегда означает серверную ошибку: там может оказаться сбой сети, отмена или неверный JSON. Предложить аудитории прочитать последовательность при успехе и при отказе.'
    },
    {
      id: 'request-demo', chapter: 'http', kicker: 'Демо · HTTP', title: 'Прочитаем запрос глазами браузера',
      lead: 'Сделайте прогноз, затем отправьте запрос с выбранным результатом.', layout: 'demo', demo: 'request',
      bullets: ['200 с книгами → данные', '200 с пустым массивом → empty', '500 → ошибка по response.ok', 'Сбой сети → отклонение Promise'],
      callout: 'В DevTools: Network → URL, Status, Response, Timing.',
      notes: 'Около 3 минут. В интерактивном демо выбрать нормальный ответ, пустой, HTTP-ошибку и отдельный режим сбоя сети; перед каждой попыткой попросить предсказать ветку. При 500 есть HTTP-ответ, при сетевом сбое доступного Response нет. Это симулятор, реальный запрос показать в DevTools при наличии рабочего приложения. Открыть Network: адрес с q, код статуса, JSON и задержка. Объяснить, что Console не заменяет Network. Завершить вопросом: куда вставить вызов getBooks, чтобы каталог загружался при появлении на экране? Подвести к проблеме вызова в теле компонента.'
    },
    {
      id: 'render-effect', chapter: 'effects', kicker: 'Рендер и внешняя система', title: 'Запросу нужен жизненный цикл',
      lead: 'Рендер вычисляет JSX. Эффект связывает компонент с сетью после commit.', layout: 'compare',
      cards: [
        { title: 'Вычисление', text: 'Фильтрация полученного массива выполняется во время рендера.', code: 'const visible = books.filter(matches);' },
        { title: 'Событие', text: 'Действие пользователя, например отправка заказа, начинается в обработчике.', code: 'onClick={handleOrder}' },
        { title: 'Эффект', text: 'Каталог синхронизирует данные с текущим поисковым запросом.', code: 'useEffect(setup, [query]);' }
      ],
      callout: 'fetch в теле компонента запустит запрос при каждом выполнении рендера.',
      notes: 'Около 2 минут. Показать плохой псевдокод: function Catalog(){ getBooks().then(setBooks); return ... }. Ответ меняет state, state ведет к новому рендеру, новый рендер запускает запрос. React также вправе повторять вычисление компонента. Точная модель useEffect — синхронизация с внешней системой, а не универсальное место для любой логики. Запрос по кнопке допустим в обработчике, но каталог, который обязан соответствовать query, здесь реализуем через эффект. Commit — момент, когда React применяет результат к интерфейсу.',
      sources: [{ label: 'React: синхронизация с эффектами', url: 'https://react.dev/learn/synchronizing-with-effects' }]
    },
    {
      id: 'effect-cycle', chapter: 'effects', kicker: 'Новый Hook', title: 'setup → cleanup → setup',
      lead: 'Эффект описывает один процесс и его завершение.', layout: 'demo', demo: 'effect',
      code: { file: 'Схема useEffect', language: 'js', text: `import { useEffect } from 'react';

useEffect(() => {
  // setup: начинаем работу с внешней системой

  return () => {
    // cleanup: прекращаем предыдущую работу
  };
}, [query]);`, highlight: [3, 6, 9] },
      bullets: ['Первый commit → setup', 'Изменились зависимости → cleanup старого, затем setup нового', 'Компонент удален → cleanup'],
      notes: 'Около 2,5 минуты. Hook вызывается на верхнем уровне компонента: не в if, не внутри map. В симуляторе смонтировать каталог, изменить query, убрать каталог. На каждом шаге студенты называют ожидаемое событие. В режиме разработки StrictMode дополнительно проверяет setup → cleanup → setup перед обычной работой; это не обещание одного запроса на всю жизнь страницы. Эффекты не исполняются при серверном рендеринге. Не привязывать объяснение к точному моменту browser paint: для задачи достаточно commit и последовательности cleanup.',
      sources: [{ label: 'React: useEffect', url: 'https://react.dev/reference/react/useEffect' }]
    },
    {
      id: 'dependencies', chapter: 'effects', kicker: 'Зависимости', title: 'Когда нужно начать заново?',
      lead: 'Массив зависимостей описывает реактивные значения, которые читает эффект.', layout: 'compare',
      cards: [
        { title: 'Без массива', text: 'Эффект повторяется после каждого commit компонента.', code: 'useEffect(setup);' },
        { title: 'Пустой массив', text: 'Нет реактивных зависимостей; есть mount и возможная проверка StrictMode.', code: 'useEffect(setup, []);' },
        { title: 'Поиск и повтор', text: 'Новый query или retryIndex запускает новый цикл.', code: 'useEffect(setup, [query, retryIndex]);' }
      ],
      callout: 'Не удаляйте dependency, чтобы скрыть предупреждение линтера.',
      notes: 'Около 2,5 минуты. Вопрос: эффект читает query, но массив пустой; получит ли сервер новый поиск? Нет, setup не повторится по изменению query. Все props, state и функции/переменные тела компонента, которые использует setup, считаются реактивными. Сравнение зависимостей — Object.is; новый объект может менять зависимость даже при похожих полях. Импортированный getBooks не создается при рендере и не является реактивной зависимостью. Setter из useState имеет стабильную идентичность; линтер допускает его пропуск. Сегодня зависимости — две простые величины, query и retryIndex.',
      sources: [{ label: 'React: зависимости эффекта', url: 'https://react.dev/learn/removing-effect-dependencies' }]
    },
    {
      id: 'async-effect', chapter: 'effects', kicker: 'async внутри эффекта', title: 'Сам callback эффекта остается обычной функцией',
      lead: 'React ожидает cleanup-функцию или undefined. async-функция возвращает Promise.', layout: 'code',
      code: { file: 'Правильная форма', language: 'js', text: `useEffect(() => {
  async function load() {
    // Здесь будут await, try, catch и finally.
  }

  load();

  return () => {
    // Здесь будет отмена и защита состояния.
  };
}, [query, retryIndex]);`, highlight: [1, 2, 8] },
      callout: 'useEffect(async () => { ... }) — неверная форма.',
      notes: 'Около 1,5 минуты. Развести две функции: внешний callback задает setup и возвращает cleanup; внутренняя async load работает с Promise и обрабатывает ошибки. Не выносить async наружу только ради сокращения, если она читает текущие зависимости: это может создать лишнюю зависимость-функцию. Далее три слайда — последовательные части одного полного эффекта, а не три независимых эффекта. Полную версию можно прочитать в заметках к слайду завершения.'
    },
    {
      id: 'effect-setup', chapter: 'effects', kicker: 'Надежный эффект · 1 / 3', title: 'Новая попытка — новый controller',
      lead: 'Каждый запуск получает собственный сигнал отмены и право обновлять состояние.', layout: 'code',
      code: { file: 'Catalog.jsx · начало эффекта', language: 'js', text: `const [books, setBooks] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [query, setQuery] = useState('');
const [retryIndex, setRetryIndex] = useState(0);

useEffect(() => {
  let active = true;
  const controller = new AbortController();

  setLoading(true);
  setError(null);
  setBooks([]);
  // Продолжение: load(), запуск и cleanup.
`, highlight: [8, 9, 11, 12, 13] },
      callout: 'Политика этого каталога: при новом поиске очищаем старые книги.',
      notes: 'Около 2 минут. Это начало фрагмента, закрытие useEffect на слайде 19. В Catalog импортированы useState/useEffect и getBooks. Начальная loading=true предотвращает вспышку пустого состояния до первой загрузки. controller нельзя переиспользовать после abort, создаем новый на каждый setup. active принадлежит конкретному запуску, а не всем запросам сразу. Синхронные сбросы происходят в новом актуальном setup. Здесь выбрана простая политика: скрываем прошлый результат. Сохранение старого результата на время обновления возможно, но требует явного состояния обновления и подписи, к какому запросу относятся данные.'
    },
    {
      id: 'effect-load', chapter: 'effects', kicker: 'Надежный эффект · 2 / 3', title: 'Устаревший запрос теряет право на state',
      lead: 'Проверяем актуальность во всех отложенных ветках: данные, ошибка и finally.', layout: 'code',
      code: { file: 'Catalog.jsx · внутри предыдущего эффекта', language: 'js', text: `async function load() {
  try {
    const result = await getBooks(query, {
      signal: controller.signal
    });
    if (active) setBooks(result);
  } catch (error) {
    if (active && error.name !== 'AbortError') {
      setError(error.message);
    }
  } finally {
    if (active) setLoading(false);
  }
}`, highlight: [6, 8, 12] },
      callout: 'Отмена — ожидаемое завершение. Ее не показываем как ошибку.',
      notes: 'Около 3 минут. getBooks скоро полностью соберем в api/books.js; он обязан передать signal в fetch и вернуть массив. active защищает каждый отложенный setter. Частая неполная защита: if(active) только перед setBooks, но старый catch выводит ошибку поверх новых данных или старый finally выключает загрузку, пока новый запрос еще идет. AbortError пропускаем, обычную ошибку показываем. В нашем API-слое бросаются Error и браузерные исключения, поэтому доступны name/message. Просить студента указать три точки проверки актуальности. Не говорить, что abort заменяет защиту от гонки: дальнейшая асинхронная обработка также может успеть завершиться.',
      sources: [{ label: 'React: запросы данных и гонки', url: 'https://react.dev/reference/react/useEffect#fetching-data-with-effects' }, { label: 'MDN: AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' }]
    },
    {
      id: 'effect-cleanup', chapter: 'effects', kicker: 'Надежный эффект · 3 / 3', title: 'Cleanup останавливает предыдущую попытку',
      lead: 'Сначала отзываем право обновлять состояние, затем отменяем сетевую работу.', layout: 'code',
      code: { file: 'Catalog.jsx · завершение эффекта', language: 'js', text: `  load();

  return () => {
    active = false;
    controller.abort();
  };
}, [query, retryIndex]);`, highlight: [4, 5, 7] },
      bullets: ['Новый query → новый запрос', 'Повтор → тот же query, новая попытка', 'Unmount → завершение текущей попытки'],
      callout: 'AbortController экономит работу; active защищает интерфейс.',
      notes: `Около 2 минут. Cleanup вызывается и при изменении зависимостей, и при удалении компонента. Отмена fetch не гарантирует, что сервер прекратил начатую обработку; это не откат заказа или записи. Для нашего GET важно прекратить ненужное чтение и закрыть доступ к state. Проверить StrictMode: первый запуск отменяется, следующий получает новый controller.
Полный эффект для показа в редакторе:
useEffect(() => {
  let active = true;
  const controller = new AbortController();
  setLoading(true);
  setError(null);
  setBooks([]);
  async function load() {
    try {
      const result = await getBooks(query, { signal: controller.signal });
      if (active) setBooks(result);
    } catch (error) {
      if (active && error.name !== "AbortError") setError(error.message);
    } finally {
      if (active) setLoading(false);
    }
  }
  load();
  return () => {
    active = false;
    controller.abort();
  };
}, [query, retryIndex]);`,
      sources: [{ label: 'MDN: отмена запроса', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#canceling_a_request' }]
    },
    {
      id: 'race-demo', chapter: 'effects', kicker: 'Демо · гонка запросов', title: 'Последний ответ может быть старым',
      lead: 'Запрос A начался раньше, но завершился после запроса B.', layout: 'demo', demo: 'race',
      steps: [
        { label: 'A · «Ма»', text: 'Медленный ответ: 1800 мс' },
        { label: 'B · «Пик»', text: 'Новый запрос: 450 мс' },
        { label: 'Без защиты', text: 'Ответ A может затереть результат B' },
        { label: 'С cleanup', text: 'A отменен и больше не меняет state' }
      ],
      callout: 'Вопрос: какой запрос сейчас имеет право выключить loading?',
      notes: 'Около 2,5 минуты. До запуска демо спросить, какой результат должен остаться в интерфейсе, если последний выбранный параметр — B. В коде используется query — строка поиска; в симуляторе A/B могут обозначать категории. Это одинаковый жизненный цикл: параметр входит в dependencies и в запрос. Запустить режим без защиты: B завершается, затем A возвращает старые данные. Включить защиту и повторить. Обсудить отдельно старую ошибку и старый finally: даже когда данные защищены, они способны испортить актуальный интерфейс. Ответ на вопрос слайда: только активный запрос B. Демонстрация моделирует порядок результатов; в реальном приложении использовать задержки на сервере или Network throttling. Этот прием подходит и для смены страницы/категории.'
    },
    {
      id: 'ui-states', chapter: 'states', kicker: 'Пользовательский интерфейс', title: 'Четыре состояния каталога',
      lead: 'Сначала загрузка, затем ошибка, пустой результат или книги.', layout: 'code',
      code: { file: 'Catalog.jsx · внутри return', language: 'js', text: `<section aria-live="polite">
  {loading ? (
    <p role="status">Загружаем книги…</p>
  ) : error ? (
    <p role="alert">Не удалось загрузить: {error}</p>
  ) : books.length === 0 ? (
    <p>По вашему запросу книг нет.</p>
  ) : (
    <BookList books={books} onAdd={onAdd} />
  )}
</section>`, highlight: [2, 4, 6, 9] },
      callout: 'Empty показываем только после успешной завершенной загрузки.',
      notes: 'Около 2 минут. Условные операторы — знакомый JSX, новые только состояния сети. Это фрагмент JSX: поле поиска располагается рядом вне этой ветки, поэтому оно остается доступным при загрузке и ошибке. Попросить пройти четыре примера: начальная загрузка, ошибка 500, успешные ноль книг, успешные две книги. Не использовать только books.length===0: иначе загрузка и ошибка выглядят как отсутствие книг. role=status сообщает о загрузке, role=alert — об ошибке. Сообщение для реального пользователя может быть дружелюбнее технического HTTP 500.'
    },
    {
      id: 'retry', chapter: 'states', kicker: 'Восстановление', title: 'Кнопка «Повторить» запускает новый цикл',
      lead: 'Поисковый текст сохраняется. Меняется номер попытки.', layout: 'code',
      code: { file: 'Catalog.jsx · ветка ошибки вместо одного p', language: 'js', text: `<div role="alert">
  <p>Не удалось загрузить книги: {error}</p>
  <button
    onClick={() => setRetryIndex((value) => value + 1)}
    disabled={loading}
  >
    Повторить
  </button>
</div>`, highlight: [4] },
      callout: 'Повтор нужен и без изменения query.',
      notes: 'Около 2 минут. Показанный JSX — замена ветки error на прошлом слайде. Эффект зависит от [query, retryIndex]. Вопрос: почему setQuery(query) не гарантирует повторный запрос? Значение осталось тем же; React может пропустить изменение, dependency не поменяется. Функциональный setter счетчика использует актуальное значение. После старта попытки loading=true, ветка ошибки исчезает. Постоянный счетчик попыток не нужно показывать пользователю.'
    },
    {
      id: 'state-check', chapter: 'states', kicker: 'Инварианты', title: 'Интерфейс объясняет текущую попытку',
      lead: 'Надежность проверяем последовательностями событий, а не одним успешным ответом.', layout: 'split',
      bullets: ['Начался новый запрос → старая ошибка очищена', 'Успех с [] → empty', 'Ошибка → сообщение и повтор', 'Cleanup → устаревшие data / error / finally игнорируются'],
      cards: [
        { title: 'Сценарий проверки', text: 'Ошибка → повтор → успех. Затем быстрый поиск A → B.' },
        { title: 'Еще одна проверка', text: 'Уберите каталог, пока запрос в ожидании, и верните его.' }
      ],
      callout: 'Политика состояния должна быть явной и проверяемой.',
      notes: 'Около 2 минут. Дать аудитории 20 секунд в парах: придумать последовательность, где ошибка остается поверх новых данных. Разобрать сброс setError(null) при старте и защиту старого catch. Повторно напомнить, что мы очистили books при старте — новая пустота сама по себе не отображается из-за loading. Переключение отображения каталога проверяет cleanup при unmount. Если сохраняем предыдущие книги, нельзя объявлять их результатом нового поиска. Этот список — приемочные проверки практики, а не требование писать сложный тестовый набор.'
    },
    {
      id: 'cors', chapter: 'states', kicker: 'Диагностика', title: 'CORS: браузер проверяет доступ к ответу',
      lead: 'Разные origin требуют корректного разрешения со стороны сервера.', layout: 'compare',
      cards: [
        { title: 'Origin', text: 'Схема + хост + порт. localhost:5173 и localhost:3000 — разные origin.' },
        { title: 'Решение', text: 'Настроить CORS на API или использовать свой серверный адаптер. В разработке возможен прокси Vite.' },
        { title: 'no-cors', text: 'Возвращает opaque-ответ: JavaScript не может прочитать его JSON или статус. Для нашего каталога не подходит.' }
      ],
      callout: 'Проверяйте Console и Network. CORS не исправляется одним frontend-флагом.',
      notes: 'Около 2 минут. Отличить недоступный сервер, неверный URL, HTTP-ошибку и ограничение CORS. Запрос может дойти до сервера, но браузер не разрешит JavaScript использовать ответ. У разных портов localhost разные origin. Серверный адаптер обращается к внешнему API на сервере, где браузерное ограничение CORS не применяется; его собственный ответ React-клиенту все равно должен быть доступен. Прокси Vite помогает в разработке, а production-маршрут нужно спроектировать отдельно. Не добавлять mode:no-cors: opaque-ответ не дает прочитать нужные данные. CORS сам по себе не является аутентификацией или защитой секретов.',
      sources: [{ label: 'MDN: CORS', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS' }, { label: 'MDN: типы ответов Fetch', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_the_response_type' }]
    },
    {
      id: 'api-layer', chapter: 'api', kicker: 'Граница ответственности', title: 'Компонент не должен знать детали HTTP',
      lead: 'books.js знает книги. Общий client.js знает HTTP и JSON.', layout: 'code',
      code: { file: 'src/api/books.js · рабочая версия', language: 'js', text: `import { getJSON } from './client.js';

export async function getBooks(query, { signal } = {}) {
  const params = new URLSearchParams({ q: query });
  const data = await getJSON('/books?' + params, { signal });
  if (!Array.isArray(data.books)) {
    throw new Error('Некорректный ответ API');
  }
  return data.books;
}`, highlight: [1, 4, 5, 6, 9] },
      callout: 'В эффекте: import { getBooks } from "./api/books.js";',
      notes: 'Около 3 минут. Этот файл завершает helper, использованный в эффекте. В начале файла импортируем getJSON из ./client.js, который покажем на следующем слайде. URLSearchParams кодирует пробелы, кириллицу и специальные символы; не склеивать пользовательский query вручную. books.js передает signal общему клиенту, а тот передает его в fetch. Array.isArray — минимальная проверка контейнера, не полноценная проверка каждого поля. Если внешний источник возвращает book_id/name/writer/cost, именно здесь или на серверной границе переводим их в id/title/author/price и проверяем типы. Не ловим ошибку и не возвращаем []: иначе сбой станет неотличим от корректного пустого результата. Компонент отвечает за loading/error/empty и актуальность, books.js — за контракт книг, client.js — за общую работу с HTTP.'
    },
    {
      id: 'normalization', chapter: 'api', kicker: 'Общий HTTP-клиент', title: 'Общие правила запроса — в client.js',
      lead: 'Получение JSON и проверку HTTP-статуса переиспользуют книги и другие сущности.', layout: 'code',
      code: { file: 'src/api/client.js · JSON GET', language: 'js', text: `export async function getJSON(path, { signal } = {}) {
  const response = await fetch('/api' + path, {
    signal,
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
  const data = await response.json();
  return data;
}`, highlight: [2, 3, 4, 6, 9] },
      callout: 'Учебный контракт: GET возвращает JSON. Путь начинается с /.',
      notes: 'Около 2 минут. getJSON отвечает за общий адрес /api, заголовок Accept, передачу signal, проверку response.ok и чтение JSON. Accept сообщает, какой формат ожидает клиент; он не заставляет сервер прислать корректные данные. Наш учебный GET-контракт возвращает JSON, включая пустой список, поэтому 204 с пустым телом здесь не предусмотрен. Не выдавать эту короткую функцию за универсальный клиент всех HTTP-методов: POST, другое тело и особые статусы потребуют расширения. books.js проверяет предметный контракт и при необходимости нормализует внешний формат; общий клиент не знает, что такое цена и название книги. Вопрос: где заменить базовый адрес, если добавляется свой Node backend? В общей конфигурации клиента. Где преобразовать writer в author? На предметной границе books.js либо в серверном адаптере.'
    },
    {
      id: 'secrets', chapter: 'api', kicker: 'Клиент и сервер', title: 'Секреты хранятся на сервере',
      lead: 'Код React и клиентские переменные окружения доступны пользователю браузера.', layout: 'flow',
      steps: [
        { label: 'React', text: 'Вызывает свой /api/books без секрета внешнего сервиса' },
        { label: 'Node.js', text: 'Читает API_KEY из серверного окружения' },
        { label: 'Внешний API', text: 'Получает запрос с ключом от сервера' }
      ],
      bullets: ['VITE_API_URL может быть публичным адресом', 'VITE_SECRET_KEY не делает ключ секретным', 'Правила доступа проверяет сервер'],
      callout: 'Секрет внешнего поставщика не отправляется в bundle, props или localStorage.',
      notes: 'Около 1,5 минуты. .env в frontend-проекте не создает серверное хранилище. Переменные VITE_ подставляются в клиентский код и видны в доставленном приложении. Секретный ключ внешнего сервиса держим в окружении backend. Это не значит, что все данные нужно прятать: публичный URL API нормально хранить в конфигурации клиента. Пользовательский токен доступа — отдельная тема аутентификации; не смешивать его с постоянным секретом поставщика. Сам факт наличия адаптера не защищает API автоматически: сервер должен контролировать доступ и допустимые запросы.',
      sources: [{ label: 'Vite: переменные окружения', url: 'https://vite.dev/guide/env-and-mode' }]
    },
    {
      id: 'swap-source', chapter: 'api', kicker: 'Подготовка к проекту', title: 'Один интерфейс — разные источники',
      lead: 'Функция getBooks(query, { signal }) возвращает Promise с массивом нашей модели.', layout: 'flow',
      steps: [
        { label: 'Catalog', text: 'Управляет поиском, состояниями и жизненным циклом' },
        { label: 'api/books.js', text: 'Стабильный интерфейс для компонентов' },
        { label: 'Источник', text: 'Готовое API, Node.js, собственная БД или Java' }
      ],
      callout: 'Смена источника проще, если JSON и ошибки имеют согласованный контракт.',
      notes: 'Около 1,5 минуты. Подвести промежуточный итог на знакомой функции: Catalog не знает, откуда берется список, но знает, какой объект получает. Для замены внешнего API своим backend нужно поменять реализацию API-слоя и сохранить модель. Новые бизнес-возможности могут потребовать изменений UI; слой не обещает магическую совместимость любых API. Проверка: если новый источник возвращает другие поля, куда добавить перевод? В API-слой клиента или серверный адаптер по выбранной границе. На финальных слайдах это же разделение позволит выбрать четыре пути проекта.'
    },
    {
      id: 'axios', chapter: 'middleware', kicker: 'Короткий обзор · библиотека HTTP', title: 'Axios: запросы и interceptors',
      lead: 'Interceptor добавляет общую обработку до отправки или после ответа.', layout: 'code',
      code: { file: 'src/api/client.js · вариант с Axios', language: 'js', text: `import axios from 'axios';

export const client = axios.create({ baseURL: '/api' });
client.interceptors.response.use(
  (response) => {
    console.info('API:', response.status);
    return response;
  },
  (error) => Promise.reject(error)
);`, highlight: [3, 6, 7, 9] },
      callout: 'Axios — вариант API-слоя. Loading, cleanup и защита от гонки остаются нужны.',
      notes: 'Около 2 минут. Axios — устанавливаемая библиотека, fetch уже есть в браузере. Это альтернативная реализация общего HTTP-клиента, устанавливать Axios для практики не нужно. В стандартной конфигурации Axios отклоняет Promise для статусов вне 2xx и разбирает JSON; эти правила можно настроить. Здесь interceptor реально выполняет общее логирование статуса каждого успешного ответа. return response сохраняет данные для вызывающего кода, а Promise.reject сохраняет путь ошибки к catch компонента. Не создаем interceptor на каждом рендере; экземпляр объявлен в модуле. Предметный слой может выполнить const { data } = await client.get("/books", { params: { q: query }, signal }); и проверить data.books. Не добавляем секрет поставщика в request interceptor браузера. signal передается Axios и отменяет запрос; форма исключения отмены может отличаться от fetch, однако наш active после cleanup защищает UI. Для реальной миграции обработку отмены согласуют с API-слоем.',
      sources: [{ label: 'Axios: interceptors', url: 'https://axios-http.com/docs/interceptors' }, { label: 'Axios: cancellation', url: 'https://axios-http.com/docs/cancellation' }, { label: 'Axios: handling errors', url: 'https://axios-http.com/docs/handling_errors' }]
    },
    {
      id: 'middleware', chapter: 'middleware', kicker: 'Термин из разных сред', title: 'Middleware: промежуточная обработка',
      lead: 'Express обрабатывает входящий запрос на сервере. Interceptor — запрос или ответ HTTP-клиента.', layout: 'compare',
      cards: [
        { title: 'Express · сервер', text: 'HTTP request → middleware → route → response. Логирование, проверка доступа, разбор тела.', code: 'app.use((req, res, next) => {\n  console.log(req.method, req.path);\n  next();\n});' },
        { title: 'Axios · HTTP-клиент', text: 'Запрос клиента → interceptor → сервер → interceptor ответа → вызывающий код. Общие заголовки, логирование, обработка ошибок.' }
      ],
      callout: 'Middleware не является React Hook. useEffect — другой механизм.',
      notes: 'Около 2 минут. Express обрабатывает HTTP-запрос на сервере: middleware может продолжить через next или завершить ответ. В примере предполагается уже созданный app; запуск сервера будем изучать на Node.js. Сравнить с interceptor из прошлого слайда: он находится в HTTP-клиенте и сопровождает исходящий запрос или входящий ответ, а Express middleware — входящий запрос нашего сервера. Redux middleware — другой контекст: оно оборачивает dispatch(action) перед reducer, но Redux сегодня подключать не нужно. Ни серверное middleware, ни interceptor не являются React Hook. Вопрос: middleware Express запустится при каждом setState в браузере? Нет; ему нужен HTTP-запрос на этот сервер.',
      sources: [{ label: 'Express: using middleware', url: 'https://expressjs.com/en/guide/using-middleware.html' }, { label: 'Redux: middleware', url: 'https://redux.js.org/understanding/history-and-design/middleware' }]
    },
    {
      id: 'checkpoint', chapter: 'middleware', kicker: 'Проверка перед выбором проекта', title: 'Разделяем три ответственности',
      lead: 'Транспорт получает данные. Эффект управляет временем. JSX объясняет состояние.', layout: 'flow',
      steps: [
        { label: 'API слой', text: 'URL, параметры, HTTP, JSON, модель книги' },
        { label: 'Эффект', text: 'Зависимости, cleanup, актуальность результата' },
        { label: 'Интерфейс', text: 'map/key, loading/error/empty/retry' }
      ],
      callout: 'Вопрос: решит ли замена fetch на Axios гонку двух поисков?',
      notes: 'Около 1 минуты. Ответ на вопрос: нет, библиотека HTTP сама не знает, какой результат актуален для нашего компонента. Быстрая проверка тремя вопросами: где response.ok? В fetch API-слое. Где active=false? В cleanup. Где key? На JSX-элементе, возвращенном map. Теперь остановить техническое углубление и перейти к последним восьми минутам про проект. Не переносить эти восемь минут в домашнее чтение: это обязательная часть занятия.'
    },
    {
      id: 'project-ready', chapter: 'projects', kicker: 'Семестровый проект · путь 1 / 4 · сейчас', title: 'React + готовое API',
      lead: 'Четыре альтернативы: готовое API; Node + внешнее API; свой backend + БД; Node + Java HTTP API.', layout: 'demo', demo: 'architecture',
      steps: [
        { label: 'React UI', text: 'Поиск, карточки, детали, состояния сети' },
        { label: 'API слой', text: 'Перевод ответа в собственную модель' },
        { label: 'Готовое API', text: 'Публичные данные и документированный контракт' }
      ],
      bullets: ['Сначала проверить доступность и CORS', 'Зафиксировать id, поля, ошибки и ограничения', 'Секретный ключ требует серверного варианта'],
      callout: 'Готовое API — сейчас. Свой Node.js — после соответствующих лекций.',
      notes: '2 минуты, начало финального обязательного блока. Явно назвать все четыре будущих пути: готовое API; Node-адаптер к внешнему API; свой backend и БД; Node-адаптер к Java лабораторной с HTTP API. Затем первый путь подробнее. Не рекомендовать конкретного внешнего провайдера без проверки его условий: задача выбора источника включает тест запроса, CORS, лимиты и форму JSON. Для браузера подходит доступный API без секретного ключа или с официально публичным клиентским ключом. Семестровый проект должен иметь пользовательский сценарий, а не только один fetch. Возможный минимум: каталог, поиск, экран деталей, корзина/избранное и четыре сетевых состояния. В симуляторе архитектур выбрать прямой доступ к готовому API.'
    },
    {
      id: 'project-proxy', chapter: 'projects', kicker: 'Семестровый проект · путь 2 / 4 · после Node.js', title: 'Node.js между React и внешним API',
      lead: 'Ваш сервер переводит контракт, хранит секреты и объединяет источники.', layout: 'flow',
      steps: [
        { label: 'React', text: 'GET /api/books?q=…' },
        { label: 'Node.js API', text: 'Проверка запроса, ключ на сервере, преобразование JSON' },
        { label: 'Внешний API', text: 'Готовый источник данных' }
      ],
      bullets: ['После лекций о Node.js добавить адаптер', 'Снаружи формат поставщика; внутри единый контракт', 'Можно добавить кеширование и понятные ошибки'],
      callout: 'API слой клиента сохраняет getBooks; реализация начинает обращаться к вашему серверу.',
      notes: '2 минуты. Это следующий этап для уже начатого frontend-проекта: внешний источник остается готовым, появляется собственная прослойка. Node хранит API_KEY в своем окружении и ограничивает допустимые маршруты/параметры; не превращать endpoint в произвольный прокси любых URL. Роль сервера — не только обойти браузерный CORS, но и дать UI стабильный контракт, а при необходимости связать несколько ответов. Между React и Node настроить CORS или общий origin. Кеш и ограничение частоты запросов — возможные улучшения после рабочего основного сценария, не обязательные сегодня. Обсудить пример: поставщик поменял name на title, изменяем адаптер, а ProductCard продолжает получать нашу модель.'
    },
    {
      id: 'project-own', chapter: 'projects', kicker: 'Семестровый проект · путь 3 / 4', title: 'Свой backend + база данных',
      lead: 'Данные и правила приложения принадлежат вашему проекту. Внешнее API не требуется.', layout: 'flow',
      steps: [
        { label: 'React UI', text: 'Список, формы и действия пользователя' },
        { label: 'Ваш backend', text: 'JSON API, валидация и бизнес-правила' },
        { label: 'Ваша БД', text: 'Постоянное хранение книг, записей или заявок' }
      ],
      bullets: ['Примеры: библиотека, бронирование, задачи, заявки', 'GET/POST/PATCH/DELETE согласовать в контракте', 'Доступ к БД и ее пароли остаются на сервере'],
      callout: 'Начните с одной сущности и полного сценария создания → просмотра → изменения.',
      notes: '2 минуты. Этот путь автономен: Node/Express или иной свой backend выполняет правила и обращается к собственной БД. Браузер не подключается к БД напрямую. Пока backend не готов, frontend может работать с фикстурой, которая соблюдает будущий JSON-контракт. Четыре состояния нужны и здесь: свой сервер тоже может быть медленным или недоступным. Объем выбирать по пользовательскому сценарию, а не по числу технологий: одна законченная сущность лучше множества незаконченных экранов. Создание/редактирование запускается событиями, а не эффектом при рендере; позже добавим серверную валидацию. Отличие от пути 2 — основное хранилище свое, готового внешнего источника нет.'
    },
    {
      id: 'project-java', chapter: 'projects', kicker: 'Семестровый проект · путь 4 / 4', title: 'Java лабораторная → Node.js → React',
      lead: 'Существующую Java-логику можно связать с новым веб-интерфейсом через HTTP.', layout: 'flow',
      steps: [
        { label: 'React', text: 'Пользовательский интерфейс и API слой' },
        { label: 'Node.js адаптер', text: 'Единый JSON-контракт для UI' },
        { label: 'Java HTTP API', text: 'Сервер над логикой лабораторной работы' }
      ],
      bullets: ['Java-приложение или его обёртка предоставляет HTTP API', 'Node обращается к Java по HTTP и преобразует ответ', 'CLI-вывод сам по себе не является веб-API', 'Согласуйте URL, методы, типы JSON и ошибки'],
      callout: 'Выберите путь по нужной функции проекта. getBooks и модель UI помогут сохранить границы.',
      notes: '2 минуты, конец 70-минутной лекции. Этот вариант специально позволяет продолжить Java лабораторную, но ей нужен настоящий HTTP-интерфейс; консольный ввод/вывод нельзя напрямую fetch-нуть. Java оставляет предметную логику у себя, Node делает подходящий для frontend контракт и при необходимости хранит серверные секреты. Убедиться, что не создали бессмысленную двойную бизнес-логику: обязанности Java и Node записываем явно. Источник данных Java может иметь собственную БД или вычислять результат; внешнее API не обязательно. Закрыть выбор четырех путей: сейчас можно строить UI с готовыми данными, после Node выбрать свою границу сервера. Мини-задание на выход: назвать свой пользовательский сценарий, выбранный путь и пример JSON одного объекта. Не оставлять этот блок факультативным.'
    },
    {
      id: 'practice', chapter: 'projects', kicker: 'Практика · следующие 20 минут · вне 70 минут', title: 'Соберите каталог, который переживает сеть',
      lead: 'Продолжите книжный магазин из прошлой лекции. Работайте с учебным GET /api/books.', layout: 'closing',
      steps: [
        { label: '0–5 минут', text: 'BookList: map, стабильный key, прежний onAdd' },
        { label: '5–10 минут', text: 'api/books.js: fetch, response.ok, JSON, q и signal' },
        { label: '10–15 минут', text: 'useEffect, cleanup, loading/error/empty/retry' },
        { label: '15–20 минут', text: 'Проверить ошибку, пустой ответ, повтор и быстрый A → B' }
      ],
      bullets: ['Готово: устаревшие data, error и finally не изменяют UI', 'Готово: отмена не выглядит как ошибка', 'В конце: выберите один из четырех путей проекта'],
      callout: 'Приемка: успех → пустой результат → ошибка → повтор → быстрый поиск → unmount.',
      notes: 'Практика 20 минут после основной лекции. Раздать предыдущий проект и endpoint или подготовленную учебную реализацию с тем же контрактом. Нельзя оставлять студентов без работающего источника: если используется симулятор, явно сообщить, что он моделирует запросы; для переноса в свой Vite-проект дать API/прокси. Минимум выполнения — map/key, отдельная API-функция, эффект с отменой и защитой всех трех асинхронных веток, четыре состояния, повтор. Через 5 минут проверить список, через 10 — Network/контракт, через 15 — UX-ветки, последние 5 — гонки и cleanup. Быстрым студентам предложить адаптировать другой формат ответа или сделать экран деталей с тем же принципом актуальности. Не требовать Axios или Redux. Перед сдачей студент коротко объясняет, зачем нужны и abort, и active. Домашний шаг: выбрать архитектурный путь, описать одну сущность, JSON и маршруты; Java-вариант обязан включать HTTP API.'
    }
  ]
};
