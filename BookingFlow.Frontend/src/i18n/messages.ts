import type { Locale } from '../types/api'

type MessageKey =
  | 'nav.catalog'
  | 'nav.bookings'
  | 'nav.admin'
  | 'nav.provider'
  | 'auth.signIn'
  | 'auth.signOut'
  | 'layout.clientArea'
  | 'layout.adminArea'
  | 'layout.providerArea'
  | 'home.heroKicker'
  | 'home.heroTitle'
  | 'home.heroSubtitle'
  | 'home.explore'
  | 'home.bookings'
  | 'home.admin'
  | 'home.provider'
  | 'home.login'
  | 'home.popularOrgs'
  | 'home.coaches'
  | 'home.events'
  | 'home.searchPlaceholder'
  | 'home.noResults'
  | 'organization.bookNow'
  | 'organization.available'
  | 'organization.inactive'
  | 'organization.amenities'
  | 'organization.highlights'
  | 'organization.gallery'
  | 'organization.coaches'
  | 'organization.resources'
  | 'organization.events'
  | 'organization.slots'
  | 'organization.loginToBook'
  | 'coach.about'
  | 'coach.specialties'
  | 'coach.achievements'
  | 'coach.formats'
  | 'coach.experience'
  | 'coach.bookSession'
  | 'common.address'
  | 'common.city'
  | 'common.website'
  | 'common.phone'
  | 'common.email'
  | 'common.gallery'
  | 'common.loading'
  | 'common.upcomingEvents'
  | 'common.confirmed'
  | 'admin.title'
  | 'admin.subtitle'
  | 'admin.organizations'
  | 'admin.resources'
  | 'admin.events'
  | 'admin.upload'
  | 'admin.locale.ru'
  | 'admin.locale.en'
  | 'admin.locale.vi'

const messages: Record<Locale, Record<MessageKey, string>> = {
  ru: {
    'nav.catalog': 'Каталог',
    'nav.bookings': 'Мои брони',
    'nav.admin': 'Admin Studio',
    'nav.provider': 'Provider Studio',
    'auth.signIn': 'Войти',
    'auth.signOut': 'Выйти',
    'layout.clientArea': 'Клиентский кабинет',
    'layout.adminArea': 'Панель управления контентом',
    'layout.providerArea': 'Кабинет исполнителя',
    'home.heroKicker': 'Booking platform for premium clubs and studios',
    'home.heroTitle': 'Бронируйте столики, персональные тренировки и события в одном эстетичном интерфейсе.',
    'home.heroSubtitle': 'Новый BookingFlow вдохновлён визуальным языком современных booking-платформ: крупные фото, понятный путь к записи и контент, который продаёт атмосферу.',
    'home.explore': 'Открыть каталог',
    'home.bookings': 'Перейти к моим броням',
    'home.admin': 'Открыть Admin Studio',
    'home.provider': 'Открыть Provider Studio',
    'home.login': 'Войти или зарегистрироваться',
    'home.popularOrgs': 'Популярные пространства',
    'home.coaches': 'Тренеры и эксперты',
    'home.events': 'Ближайшие события',
    'home.searchPlaceholder': 'Поиск по названию, адресу или формату',
    'home.noResults': 'Ничего не найдено. Попробуйте изменить запрос.',
    'organization.bookNow': 'Забронировать',
    'organization.available': 'Доступно для бронирования',
    'organization.inactive': 'Временно неактивно',
    'organization.amenities': 'Удобства и преимущества',
    'organization.highlights': 'Что можно забронировать',
    'organization.gallery': 'Галерея',
    'organization.coaches': 'Тренеры',
    'organization.resources': 'Ресурсы',
    'organization.events': 'События',
    'organization.slots': 'Свободные слоты',
    'organization.loginToBook': 'Войдите, чтобы забронировать',
    'coach.about': 'О тренере',
    'coach.specialties': 'Специализация',
    'coach.achievements': 'Достижения',
    'coach.formats': 'Форматы работы',
    'coach.experience': 'лет опыта',
    'coach.bookSession': 'Записаться на сессию',
    'common.address': 'Адрес',
    'common.city': 'Город',
    'common.website': 'Сайт',
    'common.phone': 'Телефон',
    'common.email': 'Email',
    'common.gallery': 'Галерея',
    'common.loading': 'Загрузка...',
    'common.upcomingEvents': 'Ближайшие события',
    'common.confirmed': 'Подтверждено',
    'admin.title': 'Контент и медиа',
    'admin.subtitle': 'Управление организациями, тренерами, событиями, мультиязычным контентом и файлами.',
    'admin.organizations': 'Организации',
    'admin.resources': 'Ресурсы',
    'admin.events': 'События',
    'admin.upload': 'Загрузить в S3/MinIO',
    'admin.locale.ru': 'Русский',
    'admin.locale.en': 'Английский',
    'admin.locale.vi': 'Вьетнамский',
  },
  en: {
    'nav.catalog': 'Catalog',
    'nav.bookings': 'My bookings',
    'nav.admin': 'Admin Studio',
    'nav.provider': 'Provider Studio',
    'auth.signIn': 'Sign in',
    'auth.signOut': 'Sign out',
    'layout.clientArea': 'Client area',
    'layout.adminArea': 'Content management area',
    'layout.providerArea': 'Provider area',
    'home.heroKicker': 'Booking platform for premium clubs and studios',
    'home.heroTitle': 'Reserve tables, private coaching sessions and curated events in one elegant interface.',
    'home.heroSubtitle': 'The renewed BookingFlow borrows the visual language of modern booking products: strong photography, clear booking flows and content that sells atmosphere.',
    'home.explore': 'Explore spaces',
    'home.bookings': 'Open my bookings',
    'home.admin': 'Open Admin Studio',
    'home.provider': 'Open Provider Studio',
    'home.login': 'Sign in or register',
    'home.popularOrgs': 'Featured spaces',
    'home.coaches': 'Coaches and experts',
    'home.events': 'Upcoming events',
    'home.searchPlaceholder': 'Search by venue, address or format',
    'home.noResults': 'Nothing found. Try another search term.',
    'organization.bookNow': 'Book now',
    'organization.available': 'Available for booking',
    'organization.inactive': 'Temporarily inactive',
    'organization.amenities': 'Amenities and perks',
    'organization.highlights': 'What you can book',
    'organization.gallery': 'Gallery',
    'organization.coaches': 'Coaches',
    'organization.resources': 'Resources',
    'organization.events': 'Events',
    'organization.slots': 'Available slots',
    'organization.loginToBook': 'Sign in to book',
    'coach.about': 'About the coach',
    'coach.specialties': 'Specialties',
    'coach.achievements': 'Highlights',
    'coach.formats': 'Session formats',
    'coach.experience': 'years of experience',
    'coach.bookSession': 'Book a session',
    'common.address': 'Address',
    'common.city': 'City',
    'common.website': 'Website',
    'common.phone': 'Phone',
    'common.email': 'Email',
    'common.gallery': 'Gallery',
    'common.loading': 'Loading...',
    'common.upcomingEvents': 'Upcoming events',
    'common.confirmed': 'Confirmed',
    'admin.title': 'Content and media',
    'admin.subtitle': 'Manage venues, coaches, events, multilingual content and uploaded files.',
    'admin.organizations': 'Organizations',
    'admin.resources': 'Resources',
    'admin.events': 'Events',
    'admin.upload': 'Upload to S3/MinIO',
    'admin.locale.ru': 'Russian',
    'admin.locale.en': 'English',
    'admin.locale.vi': 'Vietnamese',
  },
  vi: {
    'nav.catalog': 'Danh muc',
    'nav.bookings': 'Lich dat cua toi',
    'nav.admin': 'Admin Studio',
    'nav.provider': 'Provider Studio',
    'auth.signIn': 'Dang nhap',
    'auth.signOut': 'Dang xuat',
    'layout.clientArea': 'Khu vuc khach hang',
    'layout.adminArea': 'Khu quan ly noi dung',
    'layout.providerArea': 'Khu nha cung cap',
    'home.heroKicker': 'Nen tang dat lich cho club va studio cao cap',
    'home.heroTitle': 'Dat ban, dat buoi tap rieng va su kien trong mot giao dien dep va ro rang.',
    'home.heroSubtitle': 'BookingFlow moi lay cam hung tu cac san pham booking hien dai: hinh anh lon, hanh trinh dat lich de hieu va noi dung lam ro gia tri cua khong gian.',
    'home.explore': 'Kham pha dia diem',
    'home.bookings': 'Mo lich dat cua toi',
    'home.admin': 'Mo Admin Studio',
    'home.provider': 'Mo Provider Studio',
    'home.login': 'Dang nhap hoac dang ky',
    'home.popularOrgs': 'Khong gian noi bat',
    'home.coaches': 'Huong dan vien va chuyen gia',
    'home.events': 'Su kien sap toi',
    'home.searchPlaceholder': 'Tim theo ten, dia chi hoac hinh thuc',
    'home.noResults': 'Khong tim thay. Hay thu tu khoa khac.',
    'organization.bookNow': 'Dat ngay',
    'organization.available': 'Co the dat lich',
    'organization.inactive': 'Tam thoi khong hoat dong',
    'organization.amenities': 'Tien ich va loi the',
    'organization.highlights': 'Nhung gi ban co the dat',
    'organization.gallery': 'Thu vien anh',
    'organization.coaches': 'Huong dan vien',
    'organization.resources': 'Tai nguyen',
    'organization.events': 'Su kien',
    'organization.slots': 'Khung gio trong',
    'organization.loginToBook': 'Dang nhap de dat lich',
    'coach.about': 'Ve huong dan vien',
    'coach.specialties': 'Chuyen mon',
    'coach.achievements': 'Diem nhan',
    'coach.formats': 'Hinh thuc buoi tap',
    'coach.experience': 'nam kinh nghiem',
    'coach.bookSession': 'Dat buoi tap',
    'common.address': 'Dia chi',
    'common.city': 'Thanh pho',
    'common.website': 'Website',
    'common.phone': 'So dien thoai',
    'common.email': 'Email',
    'common.gallery': 'Thu vien',
    'common.loading': 'Dang tai...',
    'common.upcomingEvents': 'Su kien sap toi',
    'common.confirmed': 'Da xac nhan',
    'admin.title': 'Noi dung va media',
    'admin.subtitle': 'Quan ly dia diem, HLV, su kien, noi dung da ngon ngu va tep tai len.',
    'admin.organizations': 'To chuc',
    'admin.resources': 'Tai nguyen',
    'admin.events': 'Su kien',
    'admin.upload': 'Tai len S3/MinIO',
    'admin.locale.ru': 'Tieng Nga',
    'admin.locale.en': 'Tieng Anh',
    'admin.locale.vi': 'Tieng Viet',
  },
}

export function getMessage(locale: Locale, key: MessageKey) {
  return messages[locale][key]
}
