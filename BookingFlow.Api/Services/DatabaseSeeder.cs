using BookingFlow.Api.Data;
using BookingFlow.Api.Models.Content;
using BookingFlow.Domain.Entity;
using BookingFlow.Domain.Enum;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Services;

public sealed class DatabaseSeeder(ApplicationDbContext dbContext)
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private const string AdminSubject = "11111111-1111-1111-1111-111111111111";
    private const string ClientSubject = "22222222-2222-2222-2222-222222222222";
    private const string ManagerSubject = "33333333-3333-3333-3333-333333333333";
    private const string ApprovedProviderSubject = "44444444-4444-4444-4444-444444444444";
    private const string PendingProviderSubject = "55555555-5555-5555-5555-555555555555";
    private const string ReturningClientSubject = "66666666-6666-6666-6666-666666666666";
    private const string AtRiskClientSubject = "77777777-7777-7777-7777-777777777777";
    private const string VipClientSubject = "88888888-8888-8888-8888-888888888888";
    private const string FreshClientSubject = "99999999-9999-9999-9999-999999999999";

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var adminUser = await EnsureUserAsync(
            AdminSubject,
            "admin@bookingflow.local",
            "System",
            "Admin",
            "+10000000001",
            new[] { UserRole.Admin },
            cancellationToken);

        var clientUser = await EnsureUserAsync(
            ClientSubject,
            "client@bookingflow.local",
            "Demo",
            "Client",
            "+10000000002",
            Array.Empty<UserRole>(),
            cancellationToken);

        var managerUser = await EnsureUserAsync(
            ManagerSubject,
            "manager@bookingflow.local",
            "Sofia",
            "Manager",
            "+10000000003",
            Array.Empty<UserRole>(),
            cancellationToken);

        var approvedProviderUser = await EnsureUserAsync(
            ApprovedProviderSubject,
            "provider@bookingflow.local",
            "Mai",
            "Tran",
            "+10000000004",
            Array.Empty<UserRole>(),
            cancellationToken);

        var pendingProviderUser = await EnsureUserAsync(
            PendingProviderSubject,
            "creator@bookingflow.local",
            "Dmitry",
            "Sokolov",
            "+10000000005",
            Array.Empty<UserRole>(),
            cancellationToken);

        var returningClientUser = await EnsureUserAsync(
            ReturningClientSubject,
            "returning@bookingflow.local",
            "Linh",
            "Nguyen",
            "+10000000006",
            Array.Empty<UserRole>(),
            cancellationToken);

        var atRiskClientUser = await EnsureUserAsync(
            AtRiskClientSubject,
            "atrisk@bookingflow.local",
            "Mark",
            "Wilson",
            "+10000000007",
            Array.Empty<UserRole>(),
            cancellationToken);

        var vipClientUser = await EnsureUserAsync(
            VipClientSubject,
            "vip@bookingflow.local",
            "Sakura",
            "Ito",
            "+10000000008",
            Array.Empty<UserRole>(),
            cancellationToken);

        var freshClientUser = await EnsureUserAsync(
            FreshClientSubject,
            "fresh@bookingflow.local",
            "Bao",
            "Pham",
            "+10000000009",
            Array.Empty<UserRole>(),
            cancellationToken);

        if (await _dbContext.Organizations.AnyAsync(cancellationToken))
        {
            return;
        }

        var bar = new Organization
        {
            Name = "Harbor Bar",
            Type = OrganizationType.Bar,
            Description = "Atmospheric cocktail bar with table reservations and live sessions.",
            TimeZone = "Asia/Ho_Chi_Minh",
            Address = "12 Riverside Avenue",
            City = "Ho Chi Minh City",
            Phone = "+84 28 7100 1200",
            Email = "hello@harborbar.flow",
            WebsiteUrl = "https://bookingflow.local/harbor-bar",
            CoverImageUrl = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80",
            GalleryJson = StructuredContentSerializer.Serialize(new[]
            {
                new MediaAssetItem
                {
                    Url = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80",
                    Kind = "image",
                    Title = "Main lounge"
                },
                new MediaAssetItem
                {
                    Url = "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1600&q=80",
                    Kind = "image",
                    Title = "Evening dining room"
                },
                new MediaAssetItem
                {
                    Url = "https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?auto=format&fit=crop&w=1600&q=80",
                    Kind = "image",
                    Title = "Signature cocktails"
                }
            }),
            ContentJson = StructuredContentSerializer.Serialize(new OrganizationContent
            {
                HeroTitle = new LocalizedTextSet
                {
                    Ru = "Вечерняя бронь столиков для ужинов, коктейлей и live-сетов",
                    En = "Reserve your evening table for cocktails, dinner and live sets",
                    Vi = "Dat ban buoi toi cho cocktail, bua toi va nhac song"
                },
                HeroSubtitle = new LocalizedTextSet
                {
                    Ru = "Стильный бар у набережной с камерной атмосферой, авторской картой и музыкой по выходным.",
                    En = "A riverside cocktail bar with intimate mood, signature drinks and weekend live music.",
                    Vi = "Quan bar ben song voi khong khi am cung, cocktail signature va nhac song vao cuoi tuan."
                },
                Summary = new LocalizedTextSet
                {
                    Ru = "Harbor Bar подходит для свиданий, дружеских встреч и небольших private-ужинов.",
                    En = "Harbor Bar is designed for dates, social evenings and private dinners.",
                    Vi = "Harbor Bar phu hop cho hen ho, gap go ban be va bua toi rieng tu."
                },
                Description = new LocalizedTextSet
                {
                    Ru = "Мы собрали в Harbor Bar мягкий свет, бархатные посадки и авторскую коктейльную карту, чтобы бронирование ощущалось как приглашение на красивый вечер. Гости приходят к нам за атмосферой, внимательным сервисом и ощущением клуба по интересам, а не просто за столиком.",
                    En = "Harbor Bar blends warm lighting, velvet seating and a signature cocktail program so every reservation feels like an invitation to a curated night out. Guests choose us for atmosphere, polished service and a sense of belonging rather than just another table.",
                    Vi = "Harbor Bar ket hop anh sang am, ghe ngoi mem mai va menu cocktail signature de moi lan dat ban deu giong nhu loi moi den mot dem that dep. Khach den day vi khong gian, dich vu tinh te va cam giac gan ket."
                },
                Atmosphere = new LocalizedTextSet
                {
                    Ru = "Тёплый интерьер, авторские напитки и ритм городской ночи без лишнего шума.",
                    En = "Warm interiors, crafted drinks and urban nightlife energy without chaos.",
                    Vi = "Noi that am ap, do uong duoc cham chuot va nang luong dem thanh pho nhung van tinh te."
                },
                Amenities = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Коктейльная карта signature", "Live music по пятницам", "VIP-посадки", "Быстрое подтверждение брони" },
                    En = new[] { "Signature cocktail menu", "Friday live music", "VIP seating", "Fast reservation confirmation" },
                    Vi = new[] { "Menu cocktail signature", "Nhac song toi thu Sau", "Ban VIP", "Xac nhan dat ban nhanh" }
                },
                ServiceHighlights = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Столики у окна", "VIP-посадки для компаний", "Jazz night и тематические сеты" },
                    En = new[] { "Window tables", "VIP tables for groups", "Jazz night and themed sessions" },
                    Vi = new[] { "Ban gan cua so", "Ban VIP cho nhom", "Dem jazz va chuong trinh theo chu de" }
                }
            }),
            IsActive = true
        };

        var fitnessClub = new Organization
        {
            Name = "Pulse Fitness Club",
            Type = OrganizationType.FitnessClub,
            Description = "Urban performance club with premium personal coaching and boutique classes.",
            TimeZone = "Asia/Ho_Chi_Minh",
            Address = "88 Wellness Street",
            City = "Ho Chi Minh City",
            Phone = "+84 28 7100 8800",
            Email = "team@pulseflow.fit",
            WebsiteUrl = "https://bookingflow.local/pulse-fitness-club",
            CoverImageUrl = "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1600&q=80",
            GalleryJson = StructuredContentSerializer.Serialize(new[]
            {
                new MediaAssetItem
                {
                    Url = "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1600&q=80",
                    Kind = "image",
                    Title = "Main gym floor"
                },
                new MediaAssetItem
                {
                    Url = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80",
                    Kind = "image",
                    Title = "Coaching studio"
                },
                new MediaAssetItem
                {
                    Url = "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80",
                    Kind = "image",
                    Title = "Strength zone"
                }
            }),
            ContentJson = StructuredContentSerializer.Serialize(new OrganizationContent
            {
                HeroTitle = new LocalizedTextSet
                {
                    Ru = "Персональные тренировки и клубные программы в ритме большого города",
                    En = "Personal training and boutique fitness programs for an urban lifestyle",
                    Vi = "Tap luyen ca nhan va lop boutique phu hop nhip song thanh pho"
                },
                HeroSubtitle = new LocalizedTextSet
                {
                    Ru = "Pulse Fitness Club сочетает премиальный сервис, отобранных тренеров и продуманный booking-flow.",
                    En = "Pulse Fitness Club combines premium service, curated coaches and a streamlined booking flow.",
                    Vi = "Pulse Fitness Club ket hop dich vu cao cap, HLV duoc chon loc va quy trinh dat lich gon gang."
                },
                Summary = new LocalizedTextSet
                {
                    Ru = "Клуб для тех, кто хочет заниматься системно и при этом чувствовать красивую спортивную среду.",
                    En = "A club for people who train seriously and still expect a beautifully designed environment.",
                    Vi = "CLB danh cho nguoi muon tap luyen bai ban nhung van can mot khong gian dep va truyen cam hung."
                },
                Description = new LocalizedTextSet
                {
                    Ru = "В Pulse Fitness Club мы строим формат, в котором тренировка становится частью образа жизни, а не случайным визитом в зал. Персональные сессии, функциональные блоки, recovery-подход и внимательное ведение клиента помогают удерживать темп без перегруза.",
                    En = "Pulse Fitness Club is built around a lifestyle approach where training is not a random gym visit but an integrated weekly rhythm. Personal coaching, functional blocks, recovery practices and attentive guidance help clients progress consistently without burnout.",
                    Vi = "Pulse Fitness Club duoc xay dung theo triet ly bien viec tap luyen thanh mot phan cua loi song, khong chi la mot lan ghe phong gym. HLV ca nhan, bai tap chuc nang, giai phap recovery va su dong hanh sat sao giup khach hang tien bo ben vung."
                },
                Atmosphere = new LocalizedTextSet
                {
                    Ru = "Чистая архитектура, мягкий свет и ощущение клуба, куда хочется возвращаться.",
                    En = "Clean architecture, soft light and a club atmosphere worth returning to.",
                    Vi = "Kien truc gon gang, anh sang diu nhe va cam giac mot CLB muon quay lai moi tuan."
                },
                Amenities = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Персональные тренеры", "Функциональный зал", "Recovery-зона", "Групповые форматы" },
                    En = new[] { "Personal coaches", "Functional gym floor", "Recovery area", "Group formats" },
                    Vi = new[] { "HLV ca nhan", "Khu tap chuc nang", "Khu recovery", "Lop nhom" }
                },
                ServiceHighlights = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "1:1 coaching", "Силовые и mobility-сессии", "Воркшопы по выходным" },
                    En = new[] { "1:1 coaching", "Strength and mobility sessions", "Weekend workshops" },
                    Vi = new[] { "Coaching 1:1", "Buoi tap suc manh va mobility", "Workshop cuoi tuan" }
                }
            }),
            IsActive = true
        };

        var tableOne = new Resource
        {
            Organization = bar,
            Name = "Table 1",
            Type = ResourceType.Table,
            Description = "Window table for up to 4 guests.",
            Capacity = 4,
            SlotSizeMinutes = 120,
            PriceFrom = 48,
            IsActive = true
        };

        var tableTwo = new Resource
        {
            Organization = bar,
            Name = "VIP Table",
            Type = ResourceType.VipTable,
            Description = "VIP table for up to 6 guests.",
            Capacity = 6,
            SlotSizeMinutes = 120,
            PriceFrom = 96,
            IsActive = true
        };

        var trainer = new Resource
        {
            Organization = fitnessClub,
            Name = "Anna Petrova",
            Type = ResourceType.Trainer,
            Description = "Strength and mobility coach focused on sustainable progress.",
            Capacity = 1,
            SlotSizeMinutes = 60,
            ExperienceYears = 8,
            PriceFrom = 55,
            AvatarImageUrl = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
            CoverImageUrl = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
            ContentJson = StructuredContentSerializer.Serialize(new ResourceContent
            {
                Summary = new LocalizedTextSet
                {
                    Ru = "Тренер по силовой подготовке и mobility для тех, кто хочет стабильный прогресс без травм.",
                    En = "A strength and mobility coach for clients who want steady progress without overtraining.",
                    Vi = "HLV suc manh va mobility danh cho nguoi muon tien bo on dinh ma khong qua tai."
                },
                Biography = new LocalizedTextSet
                {
                    Ru = "Анна работает на стыке силовой подготовки, мобильности и качественной техники движения. Её клиенты ценят структурный подход, спокойную подачу и умение собрать программу под реальную жизнь, а не под абстрактный идеал.",
                    En = "Anna works at the intersection of strength, mobility and movement quality. Her clients appreciate a structured methodology, calm coaching style and programs tailored to real schedules rather than idealized routines.",
                    Vi = "Anna ket hop suc manh, mobility va ky thuat chuyen dong. Khach hang cua co ay danh gia cao cach lam viec co he thong, cach huong dan dien tinh va kha nang thiet ke giao an phu hop doi song that."
                },
                Approach = new LocalizedTextSet
                {
                    Ru = "Фокус на технике, прогрессии нагрузки и восстановлении между сессиями.",
                    En = "Focused on technique, progressive overload and recovery between sessions.",
                    Vi = "Tap trung vao ky thuat, tang tai co kiem soat va phuc hoi giua cac buoi tap."
                },
                Quote = new LocalizedTextSet
                {
                    Ru = "Сильное тело не строится через хаос. Оно строится через ритм.",
                    En = "A strong body is not built through chaos. It is built through rhythm.",
                    Vi = "Co the manh khong duoc xay dung bang su hon loan. No duoc xay dung bang nhip do."
                },
                Specialties = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Силовая подготовка", "Mobility", "Постановка техники", "Персональный coaching" },
                    En = new[] { "Strength training", "Mobility", "Movement technique", "Personal coaching" },
                    Vi = new[] { "Tap suc manh", "Mobility", "Ky thuat chuyen dong", "Coaching ca nhan" }
                },
                Achievements = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "8 лет практики", "70+ персональных клиентов", "Специализация по работе с офисной нагрузкой" },
                    En = new[] { "8 years of practice", "70+ personal clients", "Specializes in desk-job recovery work" },
                    Vi = new[] { "8 nam kinh nghiem", "70+ hoc vien ca nhan", "Chuyen ve phuc hoi cho nguoi lam van phong" }
                },
                Formats = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "1:1 strength", "Mobility reset", "Intro session" },
                    En = new[] { "1:1 strength", "Mobility reset", "Intro session" },
                    Vi = new[] { "Strength 1:1", "Mobility reset", "Buoi danh gia dau tien" }
                }
            }),
            IsActive = true
        };

        var trainerTwo = new Resource
        {
            Organization = fitnessClub,
            Name = "Linh Nguyen",
            Type = ResourceType.Trainer,
            Description = "Functional coach for posture, endurance and confidence in movement.",
            Capacity = 1,
            SlotSizeMinutes = 60,
            ExperienceYears = 6,
            PriceFrom = 50,
            AvatarImageUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
            CoverImageUrl = "https://images.unsplash.com/photo-1549570652-97324981a6fd?auto=format&fit=crop&w=1200&q=80",
            ContentJson = StructuredContentSerializer.Serialize(new ResourceContent
            {
                Summary = new LocalizedTextSet
                {
                    Ru = "Функциональный тренер для тех, кто хочет двигаться легче, увереннее и сильнее.",
                    En = "A functional coach for clients who want to move with more ease, confidence and strength.",
                    Vi = "HLV functional giup khach hang di chuyen nhe hon, tu tin hon va khoe hon."
                },
                Biography = new LocalizedTextSet
                {
                    Ru = "Линь ведёт клиентов через комбинацию функциональных блоков, баланса и выносливости. Её сильная сторона — превращать сложные задачи в понятный маршрут, особенно для тех, кто только возвращается к регулярным тренировкам.",
                    En = "Linh guides clients through a blend of functional blocks, balance work and endurance. Her strength is turning intimidating fitness goals into a clear route, especially for people returning to training after a long pause.",
                    Vi = "Linh dong hanh cung khach hang thong qua bai tap functional, can bang va suc ben. Diem manh cua co ay la bien muc tieu kho thanh lo trinh de hieu, dac biet voi nguoi dang quay lai viec tap sau mot thoi gian dai."
                },
                Approach = new LocalizedTextSet
                {
                    Ru = "Мягкий старт, уверенная прогрессия и внимание к привычкам вне зала.",
                    En = "Gentle starts, confident progressions and attention to lifestyle habits outside the gym.",
                    Vi = "Bat dau nhe nhang, tien bo chac chan va quan tam den thoi quen ngoai phong tap."
                },
                Quote = new LocalizedTextSet
                {
                    Ru = "Хорошая форма — это не наказание. Это навык заботы о себе.",
                    En = "Good fitness is not punishment. It is a skill of caring for yourself.",
                    Vi = "Tap luyen tot khong phai la trach phat. Do la ky nang cham soc ban than."
                },
                Specialties = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Функциональный тренинг", "Выносливость", "Коррекция осанки", "Женский фитнес" },
                    En = new[] { "Functional training", "Endurance", "Posture correction", "Women's fitness" },
                    Vi = new[] { "Functional training", "Suc ben", "Chinh tu the", "Fitness cho nu" }
                },
                Achievements = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "6 лет coaching-практики", "2000+ проведённых сессий", "Групповые и персональные форматы" },
                    En = new[] { "6 years of coaching", "2000+ sessions delivered", "Experienced in both group and personal formats" },
                    Vi = new[] { "6 nam kinh nghiem coaching", "2000+ buoi tap da thuc hien", "Kinh nghiem lop nhom va ca nhan" }
                },
                Formats = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Functional intro", "Posture focus", "Confidence builder" },
                    En = new[] { "Functional intro", "Posture focus", "Confidence builder" },
                    Vi = new[] { "Functional intro", "Tap trung tu the", "Build confidence" }
                }
            }),
            IsActive = true
        };

        var trainerThree = new Resource
        {
            Organization = fitnessClub,
            Name = "Marcus Lee",
            Type = ResourceType.Trainer,
            Description = "Performance coach for power, athleticism and disciplined weekly structure.",
            Capacity = 1,
            SlotSizeMinutes = 60,
            ExperienceYears = 10,
            PriceFrom = 68,
            AvatarImageUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
            CoverImageUrl = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
            ContentJson = StructuredContentSerializer.Serialize(new ResourceContent
            {
                Summary = new LocalizedTextSet
                {
                    Ru = "Тренер для тех, кому нужен спортивный темп, чёткая дисциплина и рост результатов.",
                    En = "A coach for clients who want athletic tempo, disciplined structure and measurable results.",
                    Vi = "HLV danh cho nguoi muon nhip tap the thao, ky luat ro rang va ket qua do duoc."
                },
                Biography = new LocalizedTextSet
                {
                    Ru = "Маркус работает с силой, мощностью и устойчивой техникой. Его стиль подходит тем, кто хочет чувствовать не только эстетику формы, но и реальную производительность тела в повседневной жизни и спорте.",
                    En = "Marcus focuses on strength, power and durable technique. His style fits clients who care not only about aesthetics but also about real performance in daily life and sport.",
                    Vi = "Marcus tap trung vao suc manh, power va ky thuat ben vung. Phong cach cua anh phu hop voi nguoi muon khong chi dep ma con nang cao hieu suat thuc te trong doi song va the thao."
                },
                Approach = new LocalizedTextSet
                {
                    Ru = "Чёткий план недели, измеримые показатели и высокий стандарт техники.",
                    En = "Clear weekly planning, measurable metrics and a high technical standard.",
                    Vi = "Ke hoach theo tuan ro rang, chi so do luong cu the va tieu chuan ky thuat cao."
                },
                Quote = new LocalizedTextSet
                {
                    Ru = "Сила — это язык уверенности, если говорить на нём регулярно.",
                    En = "Strength becomes the language of confidence when you speak it consistently.",
                    Vi = "Suc manh tro thanh ngon ngu cua su tu tin khi ban luyen tap deu dan."
                },
                Specialties = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Athletic performance", "Силовая база", "Взрывная мощность", "Тренировки для мужчин" },
                    En = new[] { "Athletic performance", "Strength base", "Explosive power", "Men's performance training" },
                    Vi = new[] { "Athletic performance", "Nen tang suc manh", "Power bung no", "Tap luyen hieu suat cho nam" }
                },
                Achievements = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "10 лет coaching", "Работа с любителями и semi-pro athletes", "Программы на результат" },
                    En = new[] { "10 years of coaching", "Works with hobbyists and semi-pro athletes", "Result-driven programming" },
                    Vi = new[] { "10 nam coaching", "Lam viec voi nguoi tap phong trao va VDV ban chuyen", "Giao an huong ket qua" }
                },
                Formats = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Power session", "Athletic base", "Performance cycle" },
                    En = new[] { "Power session", "Athletic base", "Performance cycle" },
                    Vi = new[] { "Buoi power", "Nen tang athletic", "Chu ky performance" }
                }
            }),
            IsActive = true
        };

        var approvedProviderProfile = new ProviderProfile
        {
            User = approvedProviderUser,
            DisplayName = "Mai Tran",
            Headline = "Sunrise yoga, breathwork and private coastal resets",
            City = "Da Nang",
            TimeZone = "Asia/Ho_Chi_Minh",
            Location = "My Khe Beach, Da Nang",
            AvatarImageUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
            CoverImageUrl = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80",
            GalleryJson = StructuredContentSerializer.Serialize(new[]
            {
                new MediaAssetItem
                {
                    Url = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80",
                    Kind = "image",
                    Title = "Sunrise flow"
                },
                new MediaAssetItem
                {
                    Url = "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80",
                    Kind = "image",
                    Title = "Beach practice"
                }
            }),
            ContentJson = StructuredContentSerializer.Serialize(new ProviderContent
            {
                Summary = new LocalizedTextSet
                {
                    Ru = "Частный инструктор по йоге и breathwork с рассветными практиками у моря.",
                    En = "An independent yoga and breathwork guide offering sunrise sessions by the sea.",
                    Vi = "Nguoi huong dan yoga va breathwork doc lap voi cac buoi tap binh minh ben bien."
                },
                Biography = new LocalizedTextSet
                {
                    Ru = "Май проводит камерные практики на побережье для гостей, которым нужен спокойный формат восстановления, дыхания и мягкого движения. Её сессии выбирают за атмосферу, безопасность и ощущение перезагрузки без клубной суеты.",
                    En = "Mai hosts intimate coastal sessions for guests seeking recovery, breath regulation and soft movement in a calm format. Her work is chosen for atmosphere, safety and a sense of reset outside the club setting.",
                    Vi = "Mai to chuc cac buoi tap nho ben bo bien cho khach can phuc hoi, dieu hoa hoi tho va chuyen dong nhe nhang. Moi nguoi tim den co ay vi khong gian, su an toan va cam giac duoc tai tao nang luong."
                },
                Approach = new LocalizedTextSet
                {
                    Ru = "Плавный вход, внимание к дыханию и адаптация практики под уровень клиента.",
                    En = "Gentle entry, careful breath cues and adaptation to each guest's level.",
                    Vi = "Bat dau nhe nhang, chu trong hoi tho va dieu chinh bai tap theo tung hoc vien."
                },
                Quote = new LocalizedTextSet
                {
                    Ru = "Иногда лучшее расписание начинается не в зале, а у воды на рассвете.",
                    En = "Sometimes the best schedule begins not in a studio but beside the water at sunrise.",
                    Vi = "Doi khi lich trinh tot nhat khong bat dau trong studio ma la ben mat nuoc luc binh minh."
                },
                Specialties = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Sunrise yoga", "Breathwork", "Private coastal practice" },
                    En = new[] { "Sunrise yoga", "Breathwork", "Private coastal practice" },
                    Vi = new[] { "Yoga binh minh", "Breathwork", "Buoi tap rieng ben bien" }
                },
                Highlights = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Индивидуальный формат", "Маты и аксессуары включены", "Локации у берега" },
                    En = new[] { "Private format", "Mats and props included", "Seaside locations" },
                    Vi = new[] { "Hinh thuc rieng", "Co san tham va dung cu", "Dia diem gan bo bien" }
                }
            }),
            ApprovalStatus = ModerationStatus.Approved
        };

        var pendingProviderProfile = new ProviderProfile
        {
            User = pendingProviderUser,
            DisplayName = "Dmitry Sokolov",
            Headline = "Sound bath and slow recovery rituals",
            City = "Ho Chi Minh City",
            TimeZone = "Asia/Ho_Chi_Minh",
            Location = "Thu Duc riverside garden",
            AvatarImageUrl = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80",
            CoverImageUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
            ContentJson = StructuredContentSerializer.Serialize(new ProviderContent
            {
                Summary = new LocalizedTextSet
                {
                    Ru = "Пробный профиль для модерации частных восстановительных сессий.",
                    En = "A draft provider profile waiting for moderation.",
                    Vi = "Ho so nha cung cap dang cho phe duyet."
                },
                Biography = new LocalizedTextSet
                {
                    Ru = "Дмитрий подал профиль на модерацию и пока не отображается в публичном каталоге.",
                    En = "Dmitry has submitted his profile for review and is not yet visible publicly.",
                    Vi = "Dmitry da gui ho so de xet duyet va hien chua xuat hien cong khai."
                }
            }),
            ApprovalStatus = ModerationStatus.PendingApproval
        };

        var sunriseYoga = new Resource
        {
            ProviderProfile = approvedProviderProfile,
            Name = "Sunrise Yoga by the Shore",
            Type = ResourceType.ServiceSpot,
            Description = "Private yoga flow and breathwork session on the beach at sunrise.",
            Location = "My Khe Beach",
            Capacity = 4,
            SlotSizeMinutes = 90,
            ExperienceYears = 7,
            PriceFrom = 38,
            AvatarImageUrl = approvedProviderProfile.AvatarImageUrl,
            CoverImageUrl = approvedProviderProfile.CoverImageUrl,
            GalleryJson = StructuredContentSerializer.Serialize(new[]
            {
                new MediaAssetItem
                {
                    Url = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80",
                    Kind = "image",
                    Title = "Sunrise yoga"
                }
            }),
            ContentJson = StructuredContentSerializer.Serialize(new ResourceContent
            {
                Summary = new LocalizedTextSet
                {
                    Ru = "Индивидуальная или мини-групповая практика на берегу с мягким flow и дыханием.",
                    En = "A private or small-group shoreline practice with soft flow and guided breathwork.",
                    Vi = "Buoi tap rieng hoac nhom nho ben bo bien voi flow nhe va huong dan hoi tho."
                },
                Biography = new LocalizedTextSet
                {
                    Ru = "Сессия подойдёт путешественникам, digital professionals и всем, кому нужен мягкий reset в красивой локации.",
                    En = "This session suits travelers, digital professionals and anyone seeking a soft reset in a beautiful location.",
                    Vi = "Buoi tap phu hop voi du khach, nguoi lam viec tu xa va bat ky ai can mot buoi reset nhe nhang o dia diem dep."
                },
                Approach = new LocalizedTextSet
                {
                    Ru = "60 минут движения и 30 минут дыхательных практик у воды.",
                    En = "60 minutes of movement followed by 30 minutes of breathwork by the water.",
                    Vi = "60 phut chuyen dong va 30 phut breathwork ben bo nuoc."
                },
                Specialties = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Йога на берегу", "Breathwork", "Mini-group wellness" },
                    En = new[] { "Beach yoga", "Breathwork", "Mini-group wellness" },
                    Vi = new[] { "Yoga ben bien", "Breathwork", "Wellness nhom nho" }
                },
                Formats = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Private 1:1", "Дуэт на рассвете", "Mini-group до 4 человек" },
                    En = new[] { "Private 1:1", "Sunrise duo", "Mini-group up to 4" },
                    Vi = new[] { "Private 1:1", "Cap doi binh minh", "Nhom nho toi da 4" }
                }
            }),
            ApprovalStatus = ModerationStatus.Approved,
            IsActive = true
        };

        var soundBath = new Resource
        {
            ProviderProfile = pendingProviderProfile,
            Name = "Garden Sound Bath",
            Type = ResourceType.ServiceSpot,
            Description = "Slow restorative sound bath session in an outdoor garden setting.",
            Location = "Thu Duc riverside garden",
            Capacity = 6,
            SlotSizeMinutes = 90,
            PriceFrom = 32,
            ContentJson = StructuredContentSerializer.Serialize(new ResourceContent
            {
                Summary = new LocalizedTextSet
                {
                    Ru = "Сервис ожидает подтверждения администратора и не показывается в публичном каталоге.",
                    En = "This service is pending admin approval and is hidden from the public catalog.",
                    Vi = "Dich vu nay dang cho duyet va chua xuat hien trong danh muc cong khai."
                }
            }),
            ApprovalStatus = ModerationStatus.PendingApproval,
            IsActive = true
        };

        var managerMembership = new OrganizationMembership
        {
            User = managerUser,
            Organization = fitnessClub,
            Title = "Head Manager",
            IsActive = true
        };

        var barSubscription = new OrganizationSubscription
        {
            Organization = bar,
            Plan = OrganizationSubscriptionPlan.Growth,
            IsAnalyticsEnabled = true,
            StartsAtUtc = BookingFlowClock.UtcNow.AddDays(-45),
            EndsAtUtc = BookingFlowClock.UtcNow.AddDays(45),
            MonthlyPrice = 149,
            Currency = "USD"
        };

        var fitnessSubscription = new OrganizationSubscription
        {
            Organization = fitnessClub,
            Plan = OrganizationSubscriptionPlan.Premium,
            IsAnalyticsEnabled = true,
            StartsAtUtc = BookingFlowClock.UtcNow.AddDays(-30),
            EndsAtUtc = BookingFlowClock.UtcNow.AddDays(60),
            MonthlyPrice = 249,
            Currency = "USD"
        };

        var approvedAffiliation = new ProviderOrganizationAffiliation
        {
            ProviderProfile = approvedProviderProfile,
            Organization = bar,
            Title = "Guest Wellness Host",
            IsPrimary = true,
            IsActive = true
        };

        var pendingJoinRequest = new ProviderOrganizationJoinRequest
        {
            ProviderProfile = approvedProviderProfile,
            Organization = fitnessClub,
            Message = "I would like to host sunrise recovery sessions and co-branded wellness mornings for your members.",
            Status = ProviderOrganizationJoinRequestStatus.Pending,
            CreatedAtUtc = BookingFlowClock.UtcNow.AddDays(-4)
        };

        AddDailyRules(tableOne, TimeSpan.FromHours(17), TimeSpan.FromHours(23));
        AddDailyRules(tableTwo, TimeSpan.FromHours(17), TimeSpan.FromHours(23));
        AddWeekdayRules(trainer, TimeSpan.FromHours(9), TimeSpan.FromHours(18));
        AddWeekdayRules(trainerTwo, TimeSpan.FromHours(8), TimeSpan.FromHours(16));
        AddWeekdayRules(trainerThree, TimeSpan.FromHours(10), TimeSpan.FromHours(19));
        AddWeekendRules(sunriseYoga, TimeSpan.FromHours(6), TimeSpan.FromHours(10));
        AddWeekendRules(soundBath, TimeSpan.FromHours(16), TimeSpan.FromHours(20));

        var jazzNight = new EventSession
        {
            Organization = bar,
            Name = "Friday Jazz Night",
            Description = "Live jazz evening with a welcome cocktail and reserved seating.",
            Location = "Main Hall",
            PosterImageUrl = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=80",
            ContentJson = StructuredContentSerializer.Serialize(new EventContent
            {
                Summary = new LocalizedTextSet
                {
                    Ru = "Пятничный live-set с welcome-drink и атмосферой городского джаза.",
                    En = "A Friday live jazz session with a welcome drink and elegant city-night mood.",
                    Vi = "Dem jazz thu Sau voi welcome drink va khong khi thanh pho day tinh te."
                },
                Description = new LocalizedTextSet
                {
                    Ru = "Friday Jazz Night — это медленный вход в уикенд через живую музыку, мягкий свет и сервис без суеты. Бронь места заранее помогает выбрать удобную посадку и не стоять в очереди на входе.",
                    En = "Friday Jazz Night is our slow entry into the weekend through live music, warm lighting and service that never feels rushed. Booking in advance helps guests choose the right table and skip the queue.",
                    Vi = "Friday Jazz Night la cach chung toi bat dau cuoi tuan bang nhac song, anh sang am va dich vu khong vo voi. Dat cho truoc giup chon vi tri dep va khong phai doi luc vao cua."
                },
                Notes = new LocalizedTextSet
                {
                    Ru = "Dress code smart casual.",
                    En = "Smart casual dress code.",
                    Vi = "Trang phuc smart casual."
                },
                Agenda = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "19:00 welcome-drink", "20:00 live jazz set", "22:00 after-hours cocktails" },
                    En = new[] { "19:00 welcome drink", "20:00 live jazz set", "22:00 after-hours cocktails" },
                    Vi = new[] { "19:00 welcome drink", "20:00 live jazz set", "22:00 after-hours cocktails" }
                },
                IncludedItems = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Приветственный напиток", "Резерв места", "Доступ в main hall" },
                    En = new[] { "Welcome drink", "Reserved seat", "Main hall access" },
                    Vi = new[] { "Do uong chao mung", "Cho ngoi da duoc dat", "Vao khu main hall" }
                }
            }),
            StartAtUtc = NextOccurrenceUtc(DayOfWeek.Friday, 13),
            EndAtUtc = NextOccurrenceUtc(DayOfWeek.Friday, 16),
            Capacity = 40,
            IsActive = true
        };

        var boxingWorkshop = new EventSession
        {
            Organization = fitnessClub,
            Name = "Boxing Fundamentals Workshop",
            Description = "Beginner boxing workshop with equipment and movement coaching included.",
            Location = "Studio A",
            PosterImageUrl = "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1400&q=80",
            ContentJson = StructuredContentSerializer.Serialize(new EventContent
            {
                Summary = new LocalizedTextSet
                {
                    Ru = "Воркшоп для новичков, который знакомит с техникой удара, стойкой и базовой координацией.",
                    En = "A beginner workshop covering stance, striking basics and coordination drills.",
                    Vi = "Workshop danh cho nguoi moi, gioi thieu tu the, ky thuat danh co ban va bai tap phoi hop."
                },
                Description = new LocalizedTextSet
                {
                    Ru = "Сессия подходит тем, кто хочет попробовать бокс как фитнес-формат без соревновательного давления. Мы даём экипировку, объясняем базу и создаём комфортный вход в дисциплину.",
                    En = "This session is for people who want to try boxing as a fitness format without competitive pressure. We provide gear, explain fundamentals and build a comfortable first experience.",
                    Vi = "Buoi nay phu hop voi nguoi muon thu boxing nhu mot hinh thuc fitness ma khong bi ap luc thi dau. Chung toi cung cap dung cu, giai thich nen tang va tao trai nghiem dau tien de tiep can."
                },
                Notes = new LocalizedTextSet
                {
                    Ru = "Перчатки и бинты включены.",
                    En = "Gloves and wraps are included.",
                    Vi = "Gang tay va bang quan da duoc bao gom."
                },
                Agenda = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Разминка", "Стойка и передвижение", "Базовые комбинации", "Финальный круг" },
                    En = new[] { "Warm-up", "Stance and footwork", "Basic combinations", "Final conditioning round" },
                    Vi = new[] { "Khoi dong", "Tu the va di chuyen", "Combo co ban", "Vong conditioning cuoi" }
                },
                IncludedItems = new LocalizedStringCollectionSet
                {
                    Ru = new[] { "Экипировка", "Тренерское сопровождение", "Групповой формат" },
                    En = new[] { "Equipment", "Coach support", "Group format" },
                    Vi = new[] { "Dung cu", "Su huong dan cua HLV", "Lop nhom" }
                }
            }),
            StartAtUtc = NextOccurrenceUtc(DayOfWeek.Saturday, 3),
            EndAtUtc = NextOccurrenceUtc(DayOfWeek.Saturday, 5),
            Capacity = 18,
            IsActive = true
        };

        var fitnessBookings = new[]
        {
            CreateBooking(
                returningClientUser,
                fitnessClub,
                trainer,
                daysAgo: 26,
                durationMinutes: trainer.SlotSizeMinutes,
                price: trainer.PriceFrom,
                guestCount: 1,
                hoursLeadTime: 72),
            CreateBooking(
                returningClientUser,
                fitnessClub,
                trainer,
                daysAgo: 12,
                durationMinutes: trainer.SlotSizeMinutes,
                price: trainer.PriceFrom,
                guestCount: 1,
                hoursLeadTime: 96),
            CreateBooking(
                returningClientUser,
                fitnessClub,
                trainerTwo,
                daysAgo: 3,
                durationMinutes: trainerTwo.SlotSizeMinutes,
                price: trainerTwo.PriceFrom,
                guestCount: 1,
                hoursLeadTime: 48),
            CreateBooking(
                atRiskClientUser,
                fitnessClub,
                trainerThree,
                daysAgo: 41,
                durationMinutes: trainerThree.SlotSizeMinutes,
                price: trainerThree.PriceFrom,
                guestCount: 1,
                hoursLeadTime: 120),
            CreateBooking(
                clientUser,
                fitnessClub,
                trainerTwo,
                daysAgo: 8,
                durationMinutes: trainerTwo.SlotSizeMinutes,
                price: trainerTwo.PriceFrom,
                guestCount: 1,
                hoursLeadTime: 60),
            CreateBooking(
                freshClientUser,
                fitnessClub,
                trainerThree,
                daysAgo: 6,
                durationMinutes: trainerThree.SlotSizeMinutes,
                price: trainerThree.PriceFrom,
                guestCount: 1,
                hoursLeadTime: 36),
            CreateFutureBooking(
                vipClientUser,
                fitnessClub,
                trainerThree,
                daysAhead: 5,
                durationMinutes: trainerThree.SlotSizeMinutes,
                price: trainerThree.PriceFrom,
                guestCount: 1,
                hoursLeadTime: 120),
            CreateFutureBooking(
                clientUser,
                fitnessClub,
                trainer,
                daysAhead: 9,
                durationMinutes: trainer.SlotSizeMinutes,
                price: trainer.PriceFrom,
                guestCount: 1,
                hoursLeadTime: 168),
            CreateCancelledBooking(
                vipClientUser,
                fitnessClub,
                trainerTwo,
                daysAgo: 4,
                durationMinutes: trainerTwo.SlotSizeMinutes,
                price: trainerTwo.PriceFrom,
                hoursLeadTime: 24)
        };

        var barBookings = new[]
        {
            CreateBooking(
                clientUser,
                bar,
                tableOne,
                daysAgo: 15,
                durationMinutes: tableOne.SlotSizeMinutes,
                price: tableOne.PriceFrom,
                guestCount: 2,
                hoursLeadTime: 18),
            CreateBooking(
                vipClientUser,
                bar,
                tableTwo,
                daysAgo: 5,
                durationMinutes: tableTwo.SlotSizeMinutes,
                price: tableTwo.PriceFrom,
                guestCount: 4,
                hoursLeadTime: 36),
            CreateFutureBooking(
                returningClientUser,
                bar,
                tableOne,
                daysAhead: 3,
                durationMinutes: tableOne.SlotSizeMinutes,
                price: tableOne.PriceFrom,
                guestCount: 2,
                hoursLeadTime: 48)
        };

        var eventBookings = new[]
        {
            CreateEventBooking(clientUser, fitnessClub, boxingWorkshop, daysBeforeEventBooked: 10, guestCount: 2),
            CreateEventBooking(returningClientUser, fitnessClub, boxingWorkshop, daysBeforeEventBooked: 7, guestCount: 3),
            CreateEventBooking(vipClientUser, bar, jazzNight, daysBeforeEventBooked: 14, guestCount: 2)
        };

        _dbContext.Organizations.AddRange(bar, fitnessClub);
        _dbContext.OrganizationMemberships.Add(managerMembership);
        _dbContext.OrganizationSubscriptions.AddRange(barSubscription, fitnessSubscription);
        _dbContext.ProviderProfiles.AddRange(approvedProviderProfile, pendingProviderProfile);
        _dbContext.ProviderOrganizationAffiliations.Add(approvedAffiliation);
        _dbContext.ProviderOrganizationJoinRequests.Add(pendingJoinRequest);
        _dbContext.Resources.AddRange(tableOne, tableTwo, trainer, trainerTwo, trainerThree, sunriseYoga, soundBath);
        _dbContext.EventSessions.AddRange(jazzNight, boxingWorkshop);
        _dbContext.Bookings.AddRange(fitnessBookings);
        _dbContext.Bookings.AddRange(barBookings);
        _dbContext.Bookings.AddRange(eventBookings);
        _dbContext.AnalyticsEvents.AddRange(
            CreateAnalyticsEvents(bar, tableOne, tableTwo, jazzNight, 60, 38, 14)
                .Concat(CreateAnalyticsEvents(fitnessClub, trainer, trainerTwo, boxingWorkshop, 92, 76, 21))
                .Concat(CreateAnalyticsEvents(fitnessClub, trainerThree, null, null, 34, 19, 0)));

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<User> EnsureUserAsync(
        string keycloakSubject,
        string email,
        string firstName,
        string lastName,
        string phone,
        IReadOnlyCollection<UserRole> storedRoles,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var existingUser = await _dbContext.Users.SingleOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken);

        if (existingUser is not null)
        {
            var nextRolesJson = UserProvisioningService.SerializeStoredRoles(storedRoles);
            var hasChanges = false;

            if (!string.Equals(existingUser.KeycloakSubject, keycloakSubject, StringComparison.Ordinal))
            {
                existingUser.KeycloakSubject = keycloakSubject;
                hasChanges = true;
            }

            if (!string.Equals(existingUser.RolesJson, nextRolesJson, StringComparison.Ordinal))
            {
                existingUser.RolesJson = nextRolesJson;
                hasChanges = true;
            }

            if (hasChanges)
            {
                existingUser.UpdatedAtUtc = DateTimeOffset.UtcNow;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            return existingUser;
        }

        var user = new User
        {
            KeycloakSubject = keycloakSubject,
            Email = normalizedEmail,
            FirstName = firstName,
            LastName = lastName,
            Phone = phone,
            RolesJson = UserProvisioningService.SerializeStoredRoles(storedRoles),
            IsActive = true
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    private static void AddDailyRules(Resource resource, TimeSpan startTime, TimeSpan endTime)
    {
        foreach (DayOfWeek dayOfWeek in Enum.GetValues(typeof(DayOfWeek)))
        {
            resource.AvailabilityRules.Add(new AvailabilityRule
            {
                Resource = resource,
                DayOfWeek = dayOfWeek,
                StartTime = startTime,
                EndTime = endTime,
                IsActive = true
            });
        }
    }

    private static IReadOnlyCollection<MediaAssetItem> EmptyMedia() => Array.Empty<MediaAssetItem>();

    private static void AddWeekdayRules(Resource resource, TimeSpan startTime, TimeSpan endTime)
    {
        var weekdays = new[]
        {
            DayOfWeek.Monday,
            DayOfWeek.Tuesday,
            DayOfWeek.Wednesday,
            DayOfWeek.Thursday,
            DayOfWeek.Friday
        };

        foreach (var dayOfWeek in weekdays)
        {
            resource.AvailabilityRules.Add(new AvailabilityRule
            {
                Resource = resource,
                DayOfWeek = dayOfWeek,
                StartTime = startTime,
                EndTime = endTime,
                IsActive = true
            });
        }
    }

    private static void AddWeekendRules(Resource resource, TimeSpan startTime, TimeSpan endTime)
    {
        foreach (var dayOfWeek in new[] { DayOfWeek.Saturday, DayOfWeek.Sunday })
        {
            resource.AvailabilityRules.Add(new AvailabilityRule
            {
                Resource = resource,
                DayOfWeek = dayOfWeek,
                StartTime = startTime,
                EndTime = endTime,
                IsActive = true
            });
        }
    }

    private static DateTimeOffset NextOccurrenceUtc(DayOfWeek targetDay, int hourUtc)
    {
        var now = DateTimeOffset.UtcNow;
        var date = now.Date;

        while (date.DayOfWeek != targetDay || date <= now.Date)
        {
            date = date.AddDays(1);
        }

        return new DateTimeOffset(date.Year, date.Month, date.Day, hourUtc, 0, 0, TimeSpan.Zero);
    }

    private static Booking CreateBooking(
        User user,
        Organization organization,
        Resource resource,
        int daysAgo,
        int durationMinutes,
        decimal? price,
        int guestCount,
        int hoursLeadTime)
    {
        var startAtUtc = BookingFlowClock.UtcNow
            .AddDays(-daysAgo)
            .Date
            .AddHours(8 + (daysAgo % 8));

        return new Booking
        {
            User = user,
            Organization = organization,
            Resource = resource,
            ProviderProfile = resource.ProviderProfile,
            StartAtUtc = startAtUtc,
            EndAtUtc = startAtUtc.AddMinutes(durationMinutes),
            GuestCount = guestCount,
            Status = BookingStatus.Confirmed,
            Price = price,
            Currency = price.HasValue ? "USD" : null,
            ConfirmedAtUtc = startAtUtc.AddHours(-Math.Max(1, hoursLeadTime)),
            CreatedAtUtc = startAtUtc.AddHours(-Math.Max(1, hoursLeadTime))
        };
    }

    private static Booking CreateFutureBooking(
        User user,
        Organization organization,
        Resource resource,
        int daysAhead,
        int durationMinutes,
        decimal? price,
        int guestCount,
        int hoursLeadTime)
    {
        var startAtUtc = BookingFlowClock.UtcNow
            .AddDays(daysAhead)
            .Date
            .AddHours(9 + (daysAhead % 6));

        return new Booking
        {
            User = user,
            Organization = organization,
            Resource = resource,
            ProviderProfile = resource.ProviderProfile,
            StartAtUtc = startAtUtc,
            EndAtUtc = startAtUtc.AddMinutes(durationMinutes),
            GuestCount = guestCount,
            Status = BookingStatus.Confirmed,
            Price = price,
            Currency = price.HasValue ? "USD" : null,
            ConfirmedAtUtc = BookingFlowClock.UtcNow.AddHours(-Math.Max(1, hoursLeadTime)),
            CreatedAtUtc = BookingFlowClock.UtcNow.AddHours(-Math.Max(1, hoursLeadTime))
        };
    }

    private static Booking CreateCancelledBooking(
        User user,
        Organization organization,
        Resource resource,
        int daysAgo,
        int durationMinutes,
        decimal? price,
        int hoursLeadTime)
    {
        var booking = CreateBooking(user, organization, resource, daysAgo, durationMinutes, price, 1, hoursLeadTime);
        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAtUtc = booking.StartAtUtc.AddHours(-26);
        booking.CancellationReason = "Client rescheduled offline";
        booking.UpdatedAtUtc = booking.CancelledAtUtc;
        return booking;
    }

    private static Booking CreateEventBooking(
        User user,
        Organization organization,
        EventSession eventSession,
        int daysBeforeEventBooked,
        int guestCount)
    {
        return new Booking
        {
            User = user,
            Organization = organization,
            EventSession = eventSession,
            StartAtUtc = eventSession.StartAtUtc,
            EndAtUtc = eventSession.EndAtUtc,
            GuestCount = guestCount,
            Status = BookingStatus.Confirmed,
            ConfirmedAtUtc = eventSession.StartAtUtc.AddDays(-daysBeforeEventBooked),
            CreatedAtUtc = eventSession.StartAtUtc.AddDays(-daysBeforeEventBooked)
        };
    }

    private static IEnumerable<AnalyticsEvent> CreateAnalyticsEvents(
        Organization organization,
        Resource primaryResource,
        Resource? secondaryResource,
        EventSession? eventSession,
        int organizationViews,
        int resourceViews,
        int eventViews)
    {
        var events = new List<AnalyticsEvent>();

        for (var index = 0; index < organizationViews; index++)
        {
            events.Add(new AnalyticsEvent
            {
                EntityType = AnalyticsEntityType.Organization,
                EventType = AnalyticsEventType.PageView,
                Organization = organization,
                VisitorId = $"org-{organization.Name.ToLowerInvariant().Replace(' ', '-')}-{index % 25}",
                Path = $"/organizations/{organization.Id}",
                OccurredAtUtc = BookingFlowClock.UtcNow.AddDays(-(index % 28)).AddHours(-(index % 12))
            });
        }

        for (var index = 0; index < resourceViews; index++)
        {
            var resource = secondaryResource is not null && index % 4 == 0 ? secondaryResource : primaryResource;
            events.Add(new AnalyticsEvent
            {
                EntityType = AnalyticsEntityType.Resource,
                EventType = AnalyticsEventType.PageView,
                Organization = organization,
                Resource = resource,
                VisitorId = $"resource-{resource.Name.ToLowerInvariant().Replace(' ', '-')}-{index % 35}",
                Path = $"/resources/{resource.Id}",
                OccurredAtUtc = BookingFlowClock.UtcNow.AddDays(-(index % 25)).AddHours(-(index % 8))
            });
        }

        if (eventSession is not null)
        {
            for (var index = 0; index < eventViews; index++)
            {
                events.Add(new AnalyticsEvent
                {
                    EntityType = AnalyticsEntityType.EventSession,
                    EventType = AnalyticsEventType.PageView,
                    Organization = organization,
                    EventSession = eventSession,
                    VisitorId = $"event-{eventSession.Name.ToLowerInvariant().Replace(' ', '-')}-{index % 18}",
                    Path = $"/events/{eventSession.Id}",
                    OccurredAtUtc = BookingFlowClock.UtcNow.AddDays(-(index % 20)).AddHours(-(index % 5))
                });
            }
        }

        return events;
    }
}
