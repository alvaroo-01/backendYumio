-- SQL completo (MySQL/InnoDB) 


DROP DATABASE IF EXISTS `recetario`;

CREATE DATABASE IF NOT EXISTS `recetario`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `recetario`;
SET NAMES utf8mb4;
SET time_zone = '+01:00';

-- =========================
-- 1) Catalogo: paises (ISO) + seed
-- =========================
CREATE TABLE IF NOT EXISTS `paises` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'ID único del país',
  `name` VARCHAR(30) NOT NULL COMMENT 'Nombre descriptivo',
  `iso_name` VARCHAR(30) NOT NULL COMMENT 'Nombre standard ISO',
  `alfa2` CHAR(2) NOT NULL COMMENT 'Código de 2 caracteres',
  `alfa3` CHAR(3) NOT NULL COMMENT 'Código de 3 caracteres',
  `numerico` SMALLINT UNSIGNED NOT NULL COMMENT 'Código numérico ISO (0-999)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_paises_alfa2` (`alfa2`),
  UNIQUE KEY `uq_paises_alfa3` (`alfa3`),
  UNIQUE KEY `uq_paises_numerico` (`numerico`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lista de países con códigos ISO (ISO 3166-1)';

INSERT INTO `paises` (`id`, `name`, `iso_name`, `alfa2`, `alfa3`, `numerico`) VALUES
(1, ' Afganistán', 'Afganistán', 'AF', 'AFG', 4),
(2, ' Åland', 'Islas Åland', 'AX', 'ALA', 248),
(3, ' Albania', 'Albania', 'AL', 'ALB', 8),
(4, ' Alemania', 'Alemania', 'DE', 'DEU', 276),
(5, ' Andorra', 'Andorra', 'AD', 'AND', 20),
(6, ' Angola', 'Angola', 'AO', 'AGO', 24),
(7, ' Anguila', 'Anguila', 'AI', 'AIA', 660),
(8, ' Antártida', 'Antártida', 'AQ', 'ATA', 10),
(9, ' Antigua y Barbuda', 'Antigua y Barbuda', 'AG', 'ATG', 28),
(10, ' Arabia Saudita', 'Arabia Saudita', 'SA', 'SAU', 682),
(11, ' Argelia', 'Argelia', 'DZ', 'DZA', 12),
(12, ' Argentina', 'Argentina', 'AR', 'ARG', 32),
(13, ' Armenia', 'Armenia', 'AM', 'ARM', 51),
(14, ' Aruba', 'Aruba', 'AW', 'ABW', 533),
(15, ' Australia', 'Australia', 'AU', 'AUS', 36),
(16, ' Austria', 'Austria', 'AT', 'AUT', 40),
(17, ' Azerbaiyán', 'Azerbaiyán', 'AZ', 'AZE', 31),
(18, ' Bahamas', 'Bahamas (las)', 'BS', 'BHS', 44),
(19, ' Bangladés', 'Bangladés', 'BD', 'BGD', 50),
(20, ' Barbados', 'Barbados', 'BB', 'BRB', 52),
(21, ' Baréin', 'Baréin', 'BH', 'BHR', 48),
(22, ' Bélgica', 'Bélgica', 'BE', 'BEL', 56),
(23, ' Belice', 'Belice', 'BZ', 'BLZ', 84),
(24, ' Benín', 'Benín', 'BJ', 'BEN', 204),
(25, ' Bermudas', 'Bermudas', 'BM', 'BMU', 60),
(26, ' Bielorrusia', 'Bielorrusia', 'BY', 'BLR', 112),
(27, ' Birmania', 'Myanmar', 'MM', 'MMR', 104),
(28, ' Bolivia', 'Bolivia, Estado Plurinacional ', 'BO', 'BOL', 68),
(29, ' Bosnia y Herzegovina', 'Bosnia y Herzegovina', 'BA', 'BIH', 70),
(30, ' Botsuana', 'Botsuana', 'BW', 'BWA', 72),
(31, ' Brasil', 'Brasil', 'BR', 'BRA', 76),
(32, ' Brunéi', 'Brunéi Darussalam', 'BN', 'BRN', 96),
(33, ' Bulgaria', 'Bulgaria', 'BG', 'BGR', 100),
(34, ' Burkina Faso', 'Burkina Faso', 'BF', 'BFA', 854),
(35, ' Burundi', 'Burundi', 'BI', 'BDI', 108),
(36, ' Bután', 'Bután', 'BT', 'BTN', 64),
(37, ' Cabo Verde', 'Cabo Verde', 'CV', 'CPV', 132),
(38, ' Camboya', 'Camboya', 'KH', 'KHM', 116),
(39, ' Camerún', 'Camerún', 'CM', 'CMR', 120),
(40, ' Canadá', 'Canadá', 'CA', 'CAN', 124),
(41, ' Catar', 'Catar', 'QA', 'QAT', 634),
(42, ' Caribe Neerlandés', 'Bonaire, San Eustaquio y Saba', 'BQ', 'BES', 535),
(43, ' Chad', 'Chad', 'TD', 'TCD', 148),
(44, ' Chile', 'Chile', 'CL', 'CHL', 152),
(45, ' China', 'China', 'CN', 'CHN', 156),
(46, ' Chipre', 'Chipre', 'CY', 'CYP', 196),
(47, ' Colombia', 'Colombia', 'CO', 'COL', 170),
(48, ' Comoras', 'Comoras', 'KM', 'COM', 174),
(49, ' Corea del Norte', 'Corea (la República Democrátic', 'KP', 'PRK', 408),
(50, ' Corea del Sur', 'Corea (la República de)', 'KR', 'KOR', 410),
(51, ' Costa de Marfil', 'Côte d''Ivoire', 'CI', 'CIV', 384),
(52, ' Costa Rica', 'Costa Rica', 'CR', 'CRI', 188),
(53, ' Croacia', 'Croacia', 'HR', 'HRV', 191),
(54, ' Cuba', 'Cuba', 'CU', 'CUB', 192),
(55, ' Curazao', 'Curaçao', 'CW', 'CUW', 531),
(56, ' Dinamarca', 'Dinamarca', 'DK', 'DNK', 208),
(57, ' Dominica', 'Dominica', 'DM', 'DMA', 212),
(58, ' Ecuador', 'Ecuador', 'EC', 'ECU', 218),
(59, ' Egipto', 'Egipto', 'EG', 'EGY', 818),
(60, ' El Salvador', 'El Salvador', 'SV', 'SLV', 222),
(61, ' Emiratos Árabes Unidos', 'Emiratos Árabes Unidos (Los)', 'AE', 'ARE', 784),
(62, ' Eritrea', 'Eritrea', 'ER', 'ERI', 232),
(63, ' Eslovaquia', 'Eslovaquia', 'SK', 'SVK', 703),
(64, ' Eslovenia', 'Eslovenia', 'SI', 'SVN', 705),
(65, ' España', 'España', 'ES', 'ESP', 724),
(66, ' Estados Unidos', 'Estados Unidos (los)', 'US', 'USA', 840),
(67, ' Estonia', 'Estonia', 'EE', 'EST', 233),
(68, ' Etiopía', 'Etiopía', 'ET', 'ETH', 231),
(69, ' Filipinas', 'Filipinas (las)', 'PH', 'PHL', 608),
(70, ' Finlandia', 'Finlandia', 'FI', 'FIN', 246),
(71, ' Fiyi', 'Fiyi', 'FJ', 'FJI', 242),
(72, ' Francia', 'Francia', 'FR', 'FRA', 250),
(73, ' Gabón', 'Gabón', 'GA', 'GAB', 266),
(74, ' Gambia', 'Gambia (La)', 'GM', 'GMB', 270),
(75, ' Georgia', 'Georgia', 'GE', 'GEO', 268),
(76, ' Ghana', 'Ghana', 'GH', 'GHA', 288),
(77, ' Gibraltar', 'Gibraltar', 'GI', 'GIB', 292),
(78, ' Granada', 'Granada', 'GD', 'GRD', 308),
(79, ' Grecia', 'Grecia', 'GR', 'GRC', 300),
(80, ' Groenlandia', 'Groenlandia', 'GL', 'GRL', 304),
(81, ' Guadalupe', 'Guadalupe', 'GP', 'GLP', 312),
(82, ' Guam', 'Guam', 'GU', 'GUM', 316),
(83, ' Guatemala', 'Guatemala', 'GT', 'GTM', 320),
(84, ' Guayana Francesa', 'Guayana Francesa', 'GF', 'GUF', 254),
(85, ' Guernsey', 'Guernsey', 'GG', 'GGY', 831),
(86, ' Guinea', 'Guinea', 'GN', 'GIN', 324),
(87, ' Guinea-Bisáu', 'Guinea-Bisáu', 'GW', 'GNB', 624),
(88, ' Guinea Ecuatorial', 'Guinea Ecuatorial', 'GQ', 'GNQ', 226),
(89, ' Guyana', 'Guyana', 'GY', 'GUY', 328),
(90, ' Haití', 'Haití', 'HT', 'HTI', 332),
(91, ' Honduras', 'Honduras', 'HN', 'HND', 340),
(92, ' Hong Kong', 'Hong Kong', 'HK', 'HKG', 344),
(93, ' Hungría', 'Hungría', 'HU', 'HUN', 348),
(94, ' India', 'India', 'IN', 'IND', 356),
(95, ' Indonesia', 'Indonesia', 'ID', 'IDN', 360),
(96, ' Irak', 'Irak', 'IQ', 'IRQ', 368),
(97, ' Irán', 'Irán (la República Islámica de', 'IR', 'IRN', 364),
(98, ' Irlanda', 'Irlanda', 'IE', 'IRL', 372),
(99, ' Isla Bouvet', 'Isla Bouvet', 'BV', 'BVT', 74),
(100, ' Isla de Man', 'Isla de Man', 'IM', 'IMN', 833),
(101, ' Isla de Navidad', 'Isla de Navidad', 'CX', 'CXR', 162),
(102, ' Norfolk', 'Isla Norfolk', 'NF', 'NFK', 574),
(103, ' Islandia', 'Islandia', 'IS', 'ISL', 352),
(104, ' Islas Caimán', 'Islas Caimán (las)', 'KY', 'CYM', 136),
(105, ' Islas Cocos', 'Islas Cocos (Keeling)', 'CC', 'CCK', 166),
(106, ' Islas Cook', 'Islas Cook (las)', 'CK', 'COK', 184),
(107, ' Islas Feroe', 'Islas Feroe (las)', 'FO', 'FRO', 234),
(108, ' Islas Georgias del Sur y Sand', 'Georgia del sur y las islas sa', 'GS', 'SGS', 239),
(109, ' Islas Heard y McDonald', 'Isla Heard e Islas McDonald', 'HM', 'HMD', 334),
(110, ' Islas Malvinas', 'Islas Malvinas [Falkland] (las', 'FK', 'FLK', 238),
(111, ' Islas Marianas del Norte', 'Islas Marianas del Norte (las)', 'MP', 'MNP', 580),
(112, ' Islas Marshall', 'Islas Marshall (las)', 'MH', 'MHL', 584),
(113, ' Islas Pitcairn', 'Pitcairn', 'PN', 'PCN', 612),
(114, ' Islas Salomón', 'Islas Salomón (las)', 'SB', 'SLB', 90),
(115, ' Islas Turcas y Caicos', 'Islas Turcas y Caicos (las)', 'TC', 'TCA', 796),
(116, ' Islas ultramarinas de Estados', 'Islas de Ultramar Menores de E', 'UM', 'UMI', 581),
(117, ' Islas Vírgenes Británicas', 'Islas Vírgenes (Británicas)', 'VG', 'VGB', 92),
(118, ' Islas Vírgenes de los Estados', 'Islas Vírgenes (EE.UU.)', 'VI', 'VIR', 850),
(119, ' Israel', 'Israel', 'IL', 'ISR', 376),
(120, ' Italia', 'Italia', 'IT', 'ITA', 380),
(121, ' Jamaica', 'Jamaica', 'JM', 'JAM', 388),
(122, ' Japón', 'Japón', 'JP', 'JPN', 392),
(123, ' Jersey', 'Jersey', 'JE', 'JEY', 832),
(124, ' Jordania', 'Jordania', 'JO', 'JOR', 400),
(125, ' Kazajistán', 'Kazajistán', 'KZ', 'KAZ', 398),
(126, ' Kenia', 'Kenia', 'KE', 'KEN', 404),
(127, ' Kirguistán', 'Kirguistán', 'KG', 'KGZ', 417),
(128, ' Kiribati', 'Kiribati', 'KI', 'KIR', 296),
(129, ' Kuwait', 'Kuwait', 'KW', 'KWT', 414),
(130, ' Laos', 'Lao, (la) República Democrátic', 'LA', 'LAO', 418),
(131, ' Lesoto', 'Lesoto', 'LS', 'LSO', 426),
(132, ' Letonia', 'Letonia', 'LV', 'LVA', 428),
(133, ' Líbano', 'Líbano', 'LB', 'LBN', 422),
(134, ' Liberia', 'Liberia', 'LR', 'LBR', 430),
(135, ' Libia', 'Libia', 'LY', 'LBY', 434),
(136, ' Liechtenstein', 'Liechtenstein', 'LI', 'LIE', 438),
(137, ' Lituania', 'Lituania', 'LT', 'LTU', 440),
(138, ' Luxemburgo', 'Luxemburgo', 'LU', 'LUX', 442),
(139, ' Macao', 'Macao', 'MO', 'MAC', 446),
(140, ' Madagascar', 'Madagascar', 'MG', 'MDG', 450),
(141, ' Malasia', 'Malasia', 'MY', 'MYS', 458),
(142, ' Malaui', 'Malaui', 'MW', 'MWI', 454),
(143, ' Maldivas', 'Maldivas', 'MV', 'MDV', 462),
(144, ' Malí', 'Malí', 'ML', 'MLI', 466),
(145, ' Malta', 'Malta', 'MT', 'MLT', 470),
(146, ' Marruecos', 'Marruecos', 'MA', 'MAR', 504),
(147, ' Martinica', 'Martinica', 'MQ', 'MTQ', 474),
(148, ' Mauricio', 'Mauricio', 'MU', 'MUS', 480),
(149, ' Mauritania', 'Mauritania', 'MR', 'MRT', 478),
(150, ' Mayotte', 'Mayotte', 'YT', 'MYT', 175),
(151, ' México', 'México', 'MX', 'MEX', 484),
(152, ' Micronesia', 'Micronesia (los Estados Federa', 'FM', 'FSM', 583),
(153, ' Moldavia', 'Moldavia (la República de)', 'MD', 'MDA', 498),
(154, ' Mónaco', 'Mónaco', 'MC', 'MCO', 492),
(155, ' Mongolia', 'Mongolia', 'MN', 'MNG', 496),
(156, ' Montenegro', 'Montenegro', 'ME', 'MNE', 499),
(157, ' Montserrat', 'Montserrat', 'MS', 'MSR', 500),
(158, ' Mozambique', 'Mozambique', 'MZ', 'MOZ', 508),
(159, ' Namibia', 'Namibia', 'NA', 'NAM', 516),
(160, ' Nauru', 'Nauru', 'NR', 'NRU', 520),
(161, ' Nepal', 'Nepal', 'NP', 'NPL', 524),
(162, ' Nicaragua', 'Nicaragua', 'NI', 'NIC', 558),
(163, ' Níger', 'Níger (el)', 'NE', 'NER', 562),
(164, ' Nigeria', 'Nigeria', 'NG', 'NGA', 566),
(165, ' Niue', 'Niue', 'NU', 'NIU', 570),
(166, ' Noruega', 'Noruega', 'NO', 'NOR', 578),
(167, ' Nueva Caledonia', 'Nueva Caledonia', 'NC', 'NCL', 540),
(168, ' Nueva Zelanda', 'Nueva Zelanda', 'NZ', 'NZL', 554),
(169, ' Omán', 'Omán', 'OM', 'OMN', 512),
(170, ' Países Bajos', 'Países Bajos (los)', 'NL', 'NLD', 528),
(171, ' Pakistán', 'Pakistán', 'PK', 'PAK', 586),
(172, ' Palaos', 'Palaos', 'PW', 'PLW', 585),
(173, ' Palestina', 'Palestina, Estado de', 'PS', 'PSE', 275),
(174, ' Panamá', 'Panamá', 'PA', 'PAN', 591),
(175, ' Papúa Nueva Guinea', 'Papúa Nueva Guinea', 'PG', 'PNG', 598),
(176, ' Paraguay', 'Paraguay', 'PY', 'PRY', 600),
(177, ' Perú', 'Perú', 'PE', 'PER', 604),
(178, ' Polinesia Francesa', 'Polinesia Francesa', 'PF', 'PYF', 258),
(179, ' Polonia', 'Polonia', 'PL', 'POL', 616),
(180, ' Portugal', 'Portugal', 'PT', 'PRT', 620),
(181, ' Puerto Rico', 'Puerto Rico', 'PR', 'PRI', 630),
(182, ' Reino Unido', 'Reino Unido (el)', 'GB', 'GBR', 826),
(183, ' República Centroafricana', 'República Centroafricana (la)', 'CF', 'CAF', 140),
(184, ' República Checa', 'República Checa (la)', 'CZ', 'CZE', 203),
(185, ' Macedonia', 'Macedonia (la antigua Repúblic', 'MK', 'MKD', 807),
(186, ' República del Congo', 'Congo', 'CG', 'COG', 178),
(187, ' República Democrática del Con', 'Congo (la República Democrátic', 'CD', 'COD', 180),
(188, ' República Dominicana', 'República Dominicana (la)', 'DO', 'DOM', 214),
(189, ' Reunión', 'Reunión', 'RE', 'REU', 638),
(190, ' Ruanda', 'Ruanda', 'RW', 'RWA', 646),
(191, ' Rumania', 'Rumania', 'RO', 'ROU', 642),
(192, ' Rusia', 'Rusia, (la) Federación de', 'RU', 'RUS', 643),
(193, ' República Árabe Saharaui Demo', 'Sahara Occidental', 'EH', 'ESH', 732),
(194, ' Samoa', 'Samoa', 'WS', 'WSM', 882),
(195, ' Samoa Americana', 'Samoa Americana', 'AS', 'ASM', 16),
(196, ' San Bartolomé', 'San Bartolomé', 'BL', 'BLM', 652),
(197, ' San Cristóbal y Nieves', 'San Cristóbal y Nieves', 'KN', 'KNA', 659),
(198, ' San Marino', 'San Marino', 'SM', 'SMR', 674),
(199, ' San Martín', 'San Martín (parte francesa)', 'MF', 'MAF', 663),
(200, ' San Pedro y Miquelón', 'San Pedro y Miquelón', 'PM', 'SPM', 666),
(201, ' San Vicente y las Granadinas', 'San Vicente y las Granadinas', 'VC', 'VCT', 670),
(202, ' Santa Elena, Ascensión y Tris', 'Santa Helena, Ascensión y Tris', 'SH', 'SHN', 654),
(203, ' Santa Lucía', 'Santa Lucía', 'LC', 'LCA', 662),
(204, ' Santo Tomé y Príncipe', 'Santo Tomé y Príncipe', 'ST', 'STP', 678),
(205, ' Senegal', 'Senegal', 'SN', 'SEN', 686),
(206, ' Serbia', 'Serbia', 'RS', 'SRB', 688),
(207, ' Seychelles', 'Seychelles', 'SC', 'SYC', 690),
(208, ' Sierra Leona', 'Sierra leona', 'SL', 'SLE', 694),
(209, ' Singapur', 'Singapur', 'SG', 'SGP', 702),
(210, ' Sint Maarten', 'Sint Maarten (parte holandesa)', 'SX', 'SXM', 534),
(211, ' Siria', 'Siria, (la) República Árabe', 'SY', 'SYR', 760),
(212, ' Somalia', 'Somalia', 'SO', 'SOM', 706),
(213, ' Sri Lanka', 'Sri Lanka', 'LK', 'LKA', 144),
(214, ' Suazilandia', 'Suazilandia', 'SZ', 'SWZ', 748),
(215, ' Sudáfrica', 'Sudáfrica', 'ZA', 'ZAF', 710),
(216, ' Sudán', 'Sudán (el)', 'SD', 'SDN', 729),
(217, ' Sudán del Sur', 'Sudán del Sur', 'SS', 'SSD', 728),
(218, ' Suecia', 'Suecia', 'SE', 'SWE', 752),
(219, '  Suiza', 'Suiza', 'CH', 'CHE', 756),
(220, ' Surinam', 'Surinam', 'SR', 'SUR', 740),
(221, ' Svalbard y Jan Mayen', 'Svalbard y Jan Mayen', 'SJ', 'SJM', 744),
(222, ' Tailandia', 'Tailandia', 'TH', 'THA', 764),
(223, ' República de China', 'Taiwán (Provincia de China)', 'TW', 'TWN', 158),
(224, ' Tanzania', 'Tanzania, República Unida de', 'TZ', 'TZA', 834),
(225, ' Tayikistán', 'Tayikistán', 'TJ', 'TJK', 762),
(226, ' Territorio Británico del Océa', 'Territorio Británico del Océan', 'IO', 'IOT', 86),
(227, ' Tierras Australes y Antártica', 'Territorios Australes Francese', 'TF', 'ATF', 260),
(228, ' Timor Oriental', 'Timor-Leste', 'TL', 'TLS', 626),
(229, ' Togo', 'Togo', 'TG', 'TGO', 768),
(230, ' Tokelau', 'Tokelau', 'TK', 'TKL', 772),
(231, ' Tonga', 'Tonga', 'TO', 'TON', 776),
(232, ' Trinidad y Tobago', 'Trinidad y Tobago', 'TT', 'TTO', 780),
(233, ' Túnez', 'Túnez', 'TN', 'TUN', 788),
(234, ' Turkmenistán', 'Turkmenistán', 'TM', 'TKM', 795),
(235, ' Turquía', 'Turquía', 'TR', 'TUR', 792),
(236, ' Tuvalu', 'Tuvalu', 'TV', 'TUV', 798),
(237, ' Ucrania', 'Ucrania', 'UA', 'UKR', 804),
(238, ' Uganda', 'Uganda', 'UG', 'UGA', 800),
(239, ' Uruguay', 'Uruguay', 'UY', 'URY', 858),
(240, ' Uzbekistán', 'Uzbekistán', 'UZ', 'UZB', 860),
(241, ' Vanuatu', 'Vanuatu', 'VU', 'VUT', 548),
(242, ' Ciudad del Vaticano', 'Santa Sede [Estado de la Ciuda', 'VA', 'VAT', 336),
(243, ' Venezuela', 'Venezuela, República Bolivaria', 'VE', 'VEN', 862),
(244, ' Vietnam', 'Viet Nam', 'VN', 'VNM', 704),
(245, ' Wallis y Futuna', 'Wallis y Futuna', 'WF', 'WLF', 876),
(246, ' Yemen', 'Yemen', 'YE', 'YEM', 887),
(247, ' Yibuti', 'Yibuti', 'DJ', 'DJI', 262),
(248, ' Zambia', 'Zambia', 'ZM', 'ZMB', 894),
(249, ' Zimbabue', 'Zimbabue', 'ZW', 'ZWE', 716);

-- =========================
-- 2) users (con país)
-- =========================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `country_id` INT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_vegetarian` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_vegan` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_country_id` (`country_id`),
  CONSTRAINT `fk_users_pais`
    FOREIGN KEY (`country_id`) REFERENCES `paises`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 3) user_friendships + triggers (evitar auto-relación)
-- =========================
CREATE TABLE IF NOT EXISTS `user_friendships` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `requester_user_id` INT NOT NULL,
  `addressee_user_id` INT NOT NULL,
  `status` ENUM('pending','accepted','blocked') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),

  UNIQUE KEY `uq_user_friendships_pair` (`requester_user_id`, `addressee_user_id`),
  KEY `idx_user_friendships_requester` (`requester_user_id`),
  KEY `idx_user_friendships_addressee` (`addressee_user_id`),
  KEY `idx_user_friendships_status` (`status`),

  CONSTRAINT `fk_user_friendships_requester`
    FOREIGN KEY (`requester_user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_user_friendships_addressee`
    FOREIGN KEY (`addressee_user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //

CREATE TRIGGER `tr_user_friendships_not_self_ins`
BEFORE INSERT ON `user_friendships`
FOR EACH ROW
BEGIN
  IF NEW.requester_user_id = NEW.addressee_user_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'requester_user_id no puede ser igual a addressee_user_id';
  END IF;
END//

CREATE TRIGGER `tr_user_friendships_not_self_upd`
BEFORE UPDATE ON `user_friendships`
FOR EACH ROW
BEGIN
  IF NEW.requester_user_id = NEW.addressee_user_id THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'requester_user_id no puede ser igual a addressee_user_id';
  END IF;
END//

DELIMITER ;

-- =========================
-- 4) allergens + seed (comunes)
-- =========================
CREATE TABLE IF NOT EXISTS `allergens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_allergens_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `allergens` (`name`) VALUES
('Gluten'),
('Crustáceos'),
('Huevos'),
('Pescado'),
('Cacahuetes'),
('Soja'),
('Leche y lácteos'),
('Frutos de cáscara'),
('Apio'),
('Mostaza'),
('Sésamo'),
('Sulfitos'),
('Moluscos');

-- =========================
-- 5) user_allergens (N:M)
-- =========================
CREATE TABLE IF NOT EXISTS `user_allergens` (
  `user_id` INT NOT NULL,
  `allergen_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `allergen_id`),
  KEY `idx_user_allergens_allergen_id` (`allergen_id`),
  CONSTRAINT `fk_user_allergens_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_allergens_allergen`
    FOREIGN KEY (`allergen_id`) REFERENCES `allergens`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 6) dish_types
-- =========================
CREATE TABLE IF NOT EXISTS `dish_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dish_types_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `dish_types` (`name`) VALUES
('Entrantes y aperitivos'),
('Ensaladas'),
('Sopas y cremas'),
('Guisos'),
('Estofados'),
('Arroces'),
('Pastas'),
('Legumbres'),
('Carnes'),
('Pescados y mariscos'),
('Verduras y salteados'),
('Horno y gratinados'),
('Salsas y acompañamientos'),
('Bocadillos y sándwiches'),
('Pizzas y masas'),
('Postres'),
('Repostería'),
('Bebidas');

-- =========================
-- 7) recipes
-- =========================
CREATE TABLE IF NOT EXISTS `recipes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `photo` VARCHAR(255) NULL,
  `servings` INT NOT NULL DEFAULT 1,
  `dish_type_id` INT NOT NULL,
  `country_id` INT NULL,
  `is_vegetarian` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_vegan` BOOLEAN NOT NULL DEFAULT FALSE,
  `is_public` BOOLEAN NOT NULL DEFAULT FALSE,
  `observations` TEXT NULL,

  -- NUEVO: tiempos (en minutos)
  `prep_time_active_minutes` SMALLINT UNSIGNED NULL,
  `prep_time_passive_minutes` SMALLINT UNSIGNED NULL,
  `prep_time_total_minutes` SMALLINT UNSIGNED NULL,

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),

  KEY `idx_recipes_user_id` (`user_id`),
  KEY `idx_recipes_dish_type_id` (`dish_type_id`),
  KEY `idx_recipes_country_id` (`country_id`),
  KEY `idx_recipes_is_public` (`is_public`),

  CONSTRAINT `fk_recipes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_recipes_dish_type`
    FOREIGN KEY (`dish_type_id`) REFERENCES `dish_types`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT `fk_recipes_pais`
    FOREIGN KEY (`country_id`) REFERENCES `paises`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- (Opcional) Validación servings > 0 con triggers (sin CHECK)
DELIMITER //

CREATE TRIGGER `tr_recipes_servings_positive_ins`
BEFORE INSERT ON `recipes`
FOR EACH ROW
BEGIN
  IF NEW.servings IS NULL OR NEW.servings <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'servings debe ser > 0';
  END IF;
END//

CREATE TRIGGER `tr_recipes_servings_positive_upd`
BEFORE UPDATE ON `recipes`
FOR EACH ROW
BEGIN
  IF NEW.servings IS NULL OR NEW.servings <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'servings debe ser > 0';
  END IF;
END//

DELIMITER ;

-- =========================
-- 8) recipe_ingredients
-- =========================
CREATE TABLE IF NOT EXISTS `recipe_ingredients` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `recipe_id` INT NOT NULL,
  `ingredient_text` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10,2) NULL,
  `unit` ENUM(
    'kg','g','mg',
    'l','ml',
    'taza',
    'cucharada',
    'cucharadita',
    'vaso',
    'pieza',
    'unidad',
    'pizca',
    'al_gusto'
  ) NULL,
  `order_index` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),

  KEY `idx_recipe_ingredients_recipe_id` (`recipe_id`),
  KEY `idx_recipe_ingredients_order` (`recipe_id`, `order_index`),

  CONSTRAINT `fk_recipe_ingredients_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- =========================
-- 9) recipe_steps
-- (QUITADO el CHECK step_number > 0; se valida con trigger para evitar warnings)
-- =========================
CREATE TABLE IF NOT EXISTS `recipe_steps` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `recipe_id` INT NOT NULL,
  `step_number` INT NOT NULL,
  `description` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),

  UNIQUE KEY `uq_recipe_steps_recipe_step` (`recipe_id`, `step_number`),
  KEY `idx_recipe_steps_recipe_id` (`recipe_id`),

  CONSTRAINT `fk_recipe_steps_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //

CREATE TRIGGER `tr_recipe_steps_step_positive_ins`
BEFORE INSERT ON `recipe_steps`
FOR EACH ROW
BEGIN
  IF NEW.step_number IS NULL OR NEW.step_number <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'step_number debe ser > 0';
  END IF;
END//

CREATE TRIGGER `tr_recipe_steps_step_positive_upd`
BEFORE UPDATE ON `recipe_steps`
FOR EACH ROW
BEGIN
  IF NEW.step_number IS NULL OR NEW.step_number <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'step_number debe ser > 0';
  END IF;
END//

DELIMITER ;

-- =========================
-- 10) recipe_allergens (N:M)
-- =========================
CREATE TABLE IF NOT EXISTS `recipe_allergens` (
  `recipe_id` INT NOT NULL,
  `allergen_id` INT NOT NULL,
  PRIMARY KEY (`recipe_id`, `allergen_id`),
  KEY `idx_recipe_allergens_allergen_id` (`allergen_id`),

  CONSTRAINT `fk_recipe_allergens_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_recipe_allergens_allergen`
    FOREIGN KEY (`allergen_id`) REFERENCES `allergens`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 11) shared_recipes
-- =========================
CREATE TABLE IF NOT EXISTS `shared_recipes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `recipe_id` INT NOT NULL,
  `token` VARCHAR(64) NOT NULL,
  `expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),

  UNIQUE KEY `uq_shared_recipes_token` (`token`),
  KEY `idx_shared_recipes_recipe_id` (`recipe_id`),

  CONSTRAINT `fk_shared_recipes_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 12) favorite_recipes (N:M)
-- =========================
CREATE TABLE IF NOT EXISTS `favorite_recipes` (
  `user_id` INT NOT NULL,
  `recipe_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `recipe_id`),

  KEY `idx_favorite_recipes_recipe_id` (`recipe_id`),

  CONSTRAINT `fk_favorite_recipes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_favorite_recipes_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 13) shopping_lists
-- =========================
CREATE TABLE IF NOT EXISTS `shopping_lists` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),

  KEY `idx_shopping_lists_user_id` (`user_id`),

  CONSTRAINT `fk_shopping_lists_user`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 14) shopping_list_items
-- =========================
CREATE TABLE IF NOT EXISTS `shopping_list_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `shopping_list_id` INT NOT NULL,
  `ingredient_text` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10,2) NULL,
  `unit` VARCHAR(50) NULL,
  `recipe_id` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),

  KEY `idx_shopping_list_items_list_id` (`shopping_list_id`),
  KEY `idx_shopping_list_items_recipe_id` (`recipe_id`),

  CONSTRAINT `fk_shopping_list_items_list`
    FOREIGN KEY (`shopping_list_id`) REFERENCES `shopping_lists`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_shopping_list_items_recipe`
    FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 15) Vista: avisos de alérgenos en común
-- =========================
CREATE OR REPLACE VIEW `v_recipe_allergen_warnings` AS
SELECT
  ua.user_id,
  ra.recipe_id,
  a.id   AS allergen_id,
  a.name AS allergen_name
FROM user_allergens ua
JOIN recipe_allergens ra
  ON ra.allergen_id = ua.allergen_id
JOIN allergens a
  ON a.id = ua.allergen_id;