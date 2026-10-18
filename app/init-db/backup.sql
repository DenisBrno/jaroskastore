SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;


--
-- Name: objednavky_tb; Type: TABLE; Schema: public; Owner: jaroskastore_user
--

CREATE TABLE public.objednavky_tb (
    id integer NOT NULL,
    customer_name character varying(100),
    product_name text,
    quantity integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status boolean DEFAULT false,
    ucebna character varying(20),
    prestavka_start time without time zone,
    prestavka_end time without time zone,
    poznamka text
);


ALTER TABLE public.objednavky_tb OWNER TO jaroskastore_user;

--
-- Name: objednavky_tb_id_seq; Type: SEQUENCE; Schema: public; Owner: jaroskastore_user
--

CREATE SEQUENCE public.objednavky_tb_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.objednavky_tb_id_seq OWNER TO jaroskastore_user;

--
-- Name: objednavky_tb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaroskastore_user
--

ALTER SEQUENCE public.objednavky_tb_id_seq OWNED BY public.objednavky_tb.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: jaroskastore_user
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO jaroskastore_user;

--
-- Name: uzivatele_tb; Type: TABLE; Schema: public; Owner: jaroskastore_user
--

CREATE TABLE public.uzivatele_tb (
    id integer NOT NULL,
    login character varying(100),
    password character varying(100),
    kredit integer
);


ALTER TABLE public.uzivatele_tb OWNER TO jaroskastore_user;

--
-- Name: uzivatele_tb_id_seq; Type: SEQUENCE; Schema: public; Owner: jaroskastore_user
--

CREATE SEQUENCE public.uzivatele_tb_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.uzivatele_tb_id_seq OWNER TO jaroskastore_user;

--
-- Name: uzivatele_tb_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaroskastore_user
--

ALTER SEQUENCE public.uzivatele_tb_id_seq OWNED BY public.uzivatele_tb.id;


--
-- Name: objednavky_tb id; Type: DEFAULT; Schema: public; Owner: jaroskastore_user
--

ALTER TABLE ONLY public.objednavky_tb ALTER COLUMN id SET DEFAULT nextval('public.objednavky_tb_id_seq'::regclass);


--
-- Name: uzivatele_tb id; Type: DEFAULT; Schema: public; Owner: jaroskastore_user
--

ALTER TABLE ONLY public.uzivatele_tb ALTER COLUMN id SET DEFAULT nextval('public.uzivatele_tb_id_seq'::regclass);


--
-- Data for Name: objednavky_tb; Type: TABLE DATA; Schema: public; Owner: jaroskastore_user
--

COPY public.objednavky_tb (id, customer_name, product_name, quantity, created_at, status, ucebna, prestavka_start, prestavka_end, poznamka) FROM stdin;
14	Denis	Monster Mango Loco	1	2026-03-16 09:51:18.052299	t	\N	\N	\N	\N
13	Denis	Monster Ultra Strawberry Dreams	1	2026-03-14 22:08:15.243735	t	\N	\N	\N	\N
15	Denis	Monster Mango Loco	1	2026-03-17 11:43:25.999103	t	\N	\N	\N	\N
16	Denis	Monster Mango Loco	1	2026-03-22 14:51:07.305384	f	\N	\N	\N	\N
17	Denis	Monster Mango Loco	1	2026-03-22 14:53:15.923236	f	\N	\N	\N	\N
18	Denis	Monster Mango Loco	1	2026-03-22 15:00:56.384759	f		09:35:00	09:45:00	\N
19	Denis	RedBull Classic	1	2026-03-22 15:01:23.244102	f	4A	09:35:00	09:45:00	\N
20	Denis	Monster Mango Loco	1	2026-03-22 15:11:22.874719	f	4A	09:35:00	09:45:00	\N
21	Denis	Monster Mango Loco	1	2026-03-22 15:11:51.53384	f	4A	10:35:00	10:45:00	\N
22	Denis	Monster Ultra Strawberry Dreams	1	2026-03-22 15:12:33.042726	f	4A	09:25:00	09:35:00	\N
23	Denis	RedBull Classic	1	2026-03-22 15:18:04.034475	f		09:35:00	09:45:00	\N
24	Denis	Monster Ultra Strawberry Dreams	1	2026-03-22 15:21:44.63943	f		09:35:00	09:45:00	afsaf
25	Denis	Monster Ultra Strawberry Dreams	1	2026-03-22 15:58:55.141332	f	dnf	09:35:00	09:45:00	rdh
26	Bedry	Kinder Bueno	1	2026-04-08 14:40:24.048835	f		09:35:00	09:45:00	Nigger
27	Bedry	RedBull Classic	1	2026-04-18 18:59:07.876922	f		09:35:00	09:45:00	
28	KarolinaBobkova	Monster Mango Loco	1	2026-04-23 11:55:11.810462	f		12:45:00	12:55:00	
29	Denis	Monster Ultra Strawberry Dreams	1	2026-05-03 21:09:47.268484	f	4A2	09:35:00	09:45:00	qs
\.

--
-- Data for Name: uzivatele_tb; Type: TABLE DATA; Schema: public; Owner: jaroskastore_user
--

COPY public.uzivatele_tb (id, login, password, kredit) FROM stdin;
0	Denis	12	100
\.


--
-- Name: objednavky_tb_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaroskastore_user
--

SELECT pg_catalog.setval('public.objednavky_tb_id_seq', 29, true);


--
-- Name: uzivatele_tb_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaroskastore_user
--

SELECT pg_catalog.setval('public.uzivatele_tb_id_seq', 4, true);


--
-- Name: objednavky_tb objednavky_tb_pkey; Type: CONSTRAINT; Schema: public; Owner: jaroskastore_user
--

ALTER TABLE ONLY public.objednavky_tb
    ADD CONSTRAINT objednavky_tb_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: jaroskastore_user
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: uzivatele_tb uzivatele_tb_pkey; Type: CONSTRAINT; Schema: public; Owner: jaroskastore_user
--

ALTER TABLE ONLY public.uzivatele_tb
    ADD CONSTRAINT uzivatele_tb_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: jaroskastore_user
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: TABLE objednavky_tb; Type: ACL; Schema: public; Owner: jaroskastore_user
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.objednavky_tb TO jaroskastore_user;


--
-- Name: SEQUENCE objednavky_tb_id_seq; Type: ACL; Schema: public; Owner: jaroskastore_user
--

GRANT SELECT,USAGE ON SEQUENCE public.objednavky_tb_id_seq TO jaroskastore_user;


--
-- Name: TABLE session; Type: ACL; Schema: public; Owner: jaroskastore_user
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.session TO jaroskastore_user;


--
-- Name: TABLE uzivatele_tb; Type: ACL; Schema: public; Owner: jaroskastore_user
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.uzivatele_tb TO jaroskastore_user;


--
-- Name: SEQUENCE uzivatele_tb_id_seq; Type: ACL; Schema: public; Owner: jaroskastore_user
--

GRANT SELECT,USAGE ON SEQUENCE public.uzivatele_tb_id_seq TO jaroskastore_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: jaroskastore_user
--

ALTER DEFAULT PRIVILEGES FOR ROLE jaroskastore_user IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO jaroskastore_user;



--
-- Name: pohyby; Type: TABLE; Schema: public; Owner: jaroskastore_user
--

CREATE TABLE public.pohyby (
    id integer NOT NULL,
    cas timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    typ_pohybu character varying(1),
    mnozstvi integer NOT NULL,
    cena_za_kus numeric(10,2) NOT NULL,
    bonus numeric(10,2) DEFAULT 0,
    celkem numeric(12,2) GENERATED ALWAYS AS ((((mnozstvi)::numeric * cena_za_kus) + bonus)) STORED,
    poznamka text,
    produkt text
);


ALTER TABLE public.pohyby OWNER TO jaroskastore_user;

--
-- Name: pohyby_id_seq; Type: SEQUENCE; Schema: public; Owner: jaroskastore_user
--

CREATE SEQUENCE public.pohyby_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pohyby_id_seq OWNER TO jaroskastore_user;

--
-- Name: pohyby_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaroskastore_user
--

ALTER SEQUENCE public.pohyby_id_seq OWNED BY public.pohyby.id;


--
-- Name: sklad; Type: TABLE; Schema: public; Owner: jaroskastore_user
--

CREATE TABLE public.sklad (
    id integer NOT NULL,
    produkt character varying(255) NOT NULL,
    sklad_doma integer DEFAULT 0,
    sklad_skola integer DEFAULT 0,
    cena integer,
    img text
);


ALTER TABLE public.sklad OWNER TO jaroskastore_user;

--
-- Name: sklad_id_seq; Type: SEQUENCE; Schema: public; Owner: jaroskastore_user
--

CREATE SEQUENCE public.sklad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sklad_id_seq OWNER TO jaroskastore_user;

--
-- Name: sklad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jaroskastore_user
--

ALTER SEQUENCE public.sklad_id_seq OWNED BY public.sklad.id;


--
-- Name: pohyby id; Type: DEFAULT; Schema: public; Owner: jaroskastore_user
--

ALTER TABLE ONLY public.pohyby ALTER COLUMN id SET DEFAULT nextval('public.pohyby_id_seq'::regclass);


--
-- Name: sklad id; Type: DEFAULT; Schema: public; Owner: jaroskastore_user
--

ALTER TABLE ONLY public.sklad ALTER COLUMN id SET DEFAULT nextval('public.sklad_id_seq'::regclass);


--
-- Data for Name: pohyby; Type: TABLE DATA; Schema: public; Owner: jaroskastore_user
--

COPY public.pohyby (id, cas, typ_pohybu, mnozstvi, cena_za_kus, bonus, poznamka, produkt) FROM stdin;
8	2026-05-04 07:52:00.43784	P	1	30.00	0.00	QR Platba	Coca-Cola
9	2026-05-04 12:09:22.508101	P	1	30.00	0.00	QR Platba	Coca-Cola
10	2026-05-04 13:28:05.690033	P	1	30.00	0.00	QR Platba	Coca-Cola
12	2026-05-05 10:56:31.513466	P	1	20.00	0.00	QR Platba	Kinder Bueno White
0	2026-05-01 12:00:00	N	1	6184.09	0.00	prechod na db	\N
1	2026-05-01 12:00:00	P	1	4567.00	0.00	prechod na db	\N
15	2026-05-06 08:48:25.107437	P	1	20.00	0.00	QR Platba	Dr. Pepper
16	2026-05-06 09:45:24.724839	P	1	30.00	0.00	QR Platba	Monster Ultra White
17	2026-05-06 09:45:24.751891	P	1	30.00	0.00	QR Platba	Monster Mango Loco
19	2026-05-06 13:49:32.292775	P	1	20.00	2.00	QR Platba	Dupetky
21	2026-05-06 13:52:49.331046	P	1	30.00	0.00	QR Platba	Coca-Cola
20	2026-05-06 13:49:32.310892	P	1	20.00	0.00	QR Platba	Kinder Bueno White
18	2026-05-06 09:45:24.752793	P	1	20.00	0.00	QR Platba	Kinder Bueno White
23	2026-05-07 10:22:40.831053	P	2	20.00	0.00	QR Platba	Kinder Bueno White
22	2026-05-07 10:22:40.812178	P	1	17.00	-17.00	QR Platba	Corny White Choco
24	2026-05-07 11:49:22.219814	P	2	6.00	0.00	QR Platba	Alaska
25	2026-05-11 07:48:35.042137	P	1	6.00	0.00	QR Platba	Alaska
26	2026-05-11 07:48:35.071891	P	1	20.00	0.00	QR Platba	Dr. Pepper
27	2026-05-11 10:25:16.935724	P	1	30.00	0.00	QR Platba	Coca-Cola
28	2026-05-11 10:44:29.467721	P	1	17.00	0.00	QR Platba	Corny White Choco
29	2026-05-11 12:55:07.544055	P	1	30.00	0.00	QR Platba	Coca-Cola
30	2026-05-12 11:19:14.403302	P	1	30.00	0.00	QR Platba	Monster Mango Loco
31	2026-05-12 11:19:14.419298	P	1	30.00	0.00	QR Platba	Coca-Cola
32	2026-05-14 10:26:41.711375	P	1	30.00	0.00	QR Platba	Monster Ultra White
33	2026-05-14 10:26:41.724992	P	1	17.00	0.00	QR Platba	Corny Salted Caramel
34	2026-05-14 11:49:26.553764	P	1	30.00	0.00	QR Platba	RedBull Classic
35	2026-05-14 11:50:24.108788	P	1	30.00	0.00	QR Platba	RedBull Classic
36	2026-05-14 13:35:16.045579	P	1	6.00	1.00	QR Platba	Alaska
37	2026-05-14 13:46:46.807846	P	2	20.00	0.00	QR Platba	Kinder Bueno White
38	2026-05-14 13:46:53.470528	P	1	20.00	2.00	QR Platba	Kinder Bueno White
39	2026-05-15 07:10:56.489075	P	1	30.00	0.00	QR Platba	Coca-Cola
40	2026-05-16 19:51:53.577684	P	1	30.00	0.00	QR Platba	Coca-Cola
41	2026-05-16 20:29:56.059233	P	1	20.00	-20.00	QR Platba	Kinder Bueno White
50	2026-05-17 19:48:21.508001	N	16	25.00	0.00	\N	Coca-Cola
51	2026-05-17 20:06:29.235419	N	3	45.00	0.00	\N	Pringles
52	2026-05-17 20:08:02.109651	N	20	14.50	0.00	\N	Cool (různé příchutě)
53	2026-05-17 20:08:56.252816	N	14	25.20	0.00	\N	Opavia oplatky
54	2026-05-19 12:38:24.216704	P	1	30.00	0.00	QR Platba	Coca-Cola
55	2026-05-20 09:46:27.683372	P	1	30.00	0.00	QR Platba	RedBull Classic
56	2026-05-20 09:46:54.229682	P	1	17.00	0.00	QR Platba	Corny Salted Caramel
57	2026-05-20 09:46:54.247903	P	1	20.00	0.00	QR Platba	Kinder Bueno White
58	2026-05-20 09:47:08.678651	P	1	30.00	0.00	QR Platba	Monster Ultra White
59	2026-05-20 09:47:08.704836	P	1	20.00	0.00	QR Platba	Dupetky
60	2026-05-20 09:47:08.706057	P	1	20.00	0.00	QR Platba	Kinder Bueno White
61	2026-05-21 08:46:58.249384	P	2	30.00	0.00	QR Platba	Coca-Cola
62	2026-05-21 11:19:34.354668	P	2	20.00	0.00	QR Platba	Kinder Bueno White
63	2026-05-21 11:19:42.355978	P	1	20.00	0.00	QR Platba	Cool (různé příchutě)
64	2026-05-23 20:12:43.460273	P	1	20.00	-8.00	QR Platba	Kinder Bueno White
65	2026-05-26 17:16:56.71122	P	1	20.00	0.00	QR Platba	Dr. Pepper
66	2026-06-01 10:39:32.263196	P	1	30.00	0.00	QR Platba	Coca-Cola
67	2026-06-01 10:39:32.288407	P	1	20.00	0.00	QR Platba	Kinder Bueno White
68	2026-06-01 10:39:32.293562	P	1	30.00	0.00	QR Platba	Opavia oplatky
69	2026-06-01 10:40:06.378075	P	1	30.00	1.00	QR Platba	Coca-Cola
70	2026-06-01 10:40:06.398944	P	1	6.00	0.00	QR Platba	Alaska
71	2026-06-01 10:40:06.405229	P	1	20.00	0.00	QR Platba	Kinder Bueno White
72	2026-06-02 09:09:03.800655	P	1	30.00	1.00	QR Platba	Monster Ultra White
73	2026-06-02 09:09:03.845656	P	2	30.00	0.00	QR Platba	Monster Ultra Strawberry Dreams
74	2026-06-02 09:09:03.842642	P	1	30.00	0.00	QR Platba	Monster Mango Loco
76	2026-06-02 09:09:03.848969	P	2	6.00	0.00	QR Platba	Alaska
75	2026-06-02 09:09:03.84805	P	2	20.00	0.00	QR Platba	Dupetky
77	2026-06-03 14:52:05.341318	P	1	17.00	0.00	QR Platba	Corny Salted Caramel
78	2026-06-03 14:53:00.337897	P	1	30.00	0.00	QR Platba	Monster Ultra White
79	2026-06-03 14:53:21.24842	P	1	20.00	0.00	QR Platba	Cool (různé příchutě)
80	2026-06-05 20:52:53.570005	P	1	30.00	-30.00	QR Platba	Coca-Cola
81	2026-06-05 20:53:11.042901	P	1	20.00	0.00	QR Platba	Dr. Pepper
82	2026-06-05 20:53:28.345242	P	1	20.00	0.00	QR Platba	Dupetky
83	2026-06-05 20:54:17.385397	P	1	30.00	0.00	QR Platba	Monster Mango Loco
84	2026-06-08 10:41:03.751323	P	1	30.00	0.00	QR Platba	Monster Ultra White
85	2026-06-08 10:41:03.753368	P	2	20.00	0.00	QR Platba	Dr. Pepper
86	2026-06-08 10:41:03.759071	P	1	20.00	0.00	QR Platba	Cool (různé příchutě)
87	2026-06-08 10:41:03.794132	P	1	30.00	0.00	QR Platba	Coca-Cola
88	2026-06-08 10:41:03.795973	P	1	30.00	0.00	QR Platba	Monster Mango Loco
89	2026-06-08 10:41:03.800665	P	1	30.00	0.00	QR Platba	RedBull Classic
90	2026-06-08 10:41:03.803485	P	1	6.00	0.00	QR Platba	Alaska
91	2026-06-09 10:03:28.358246	P	1	30.00	0.00	QR Platba	Monster Mango Loco
92	2026-06-11 10:36:23.002092	P	1	20.00	0.00	QR Platba	Dupetky
\.


--
-- Data for Name: sklad; Type: TABLE DATA; Schema: public; Owner: jaroskastore_user
--

COPY public.sklad (id, produkt, sklad_doma, sklad_skola, cena, img) FROM stdin;
9	Corny Salted Caramel	18	0	17	/img/corny.png
17	Opavia oplatky	12	1	30	/img/opavia.png
14	Kinder Bueno White	40	4	20	/img/bueno-white.png
6	Perlivá voda	0	0	12	/img/voda.png
16	Cool (různé příchutě)	16	1	20	/img/cool.png
5	RedBull Classic	8	3	30	/img/redbull.png
7	Alaska	22	2	6	/img/alaska.png
1	Monster Ultra White	1	2	30	/img/Monster_UW.png
10	Corny Banana	2	2	17	/img/corny.png
3	Monster Ultra Strawberry Dreams	6	1	30	/img/Monster_USD.png
13	Dr. Pepper	5	2	20	/img/drpepper.png
4	Coca-Cola	8	4	30	/img/Cola.png
2	Monster Mango Loco	9	1	30	/img/Monster_ML.png
8	Dupetky	1	2	20	/img/dupetky.png
11	Corny White Choco	16	1	17	/img/corny.png
12	Kinder Bueno	10	0	20	/img/bueno.png
15	Pringles	3	0	60	/img/pringles.png
\.


--
-- Name: pohyby_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaroskastore_user
--

SELECT pg_catalog.setval('public.pohyby_id_seq', 92, true);


--
-- Name: sklad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jaroskastore_user
--

SELECT pg_catalog.setval('public.sklad_id_seq', 17, true);


--
-- Name: pohyby pohyby_pkey; Type: CONSTRAINT; Schema: public; Owner: jaroskastore_user
--

ALTER TABLE ONLY public.pohyby
    ADD CONSTRAINT pohyby_pkey PRIMARY KEY (id);


--
-- Name: sklad sklad_pkey; Type: CONSTRAINT; Schema: public; Owner: jaroskastore_user
--

ALTER TABLE ONLY public.sklad
    ADD CONSTRAINT sklad_pkey PRIMARY KEY (id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO jaroskastore_user;


--
-- Name: TABLE pohyby; Type: ACL; Schema: public; Owner: jaroskastore_user
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.pohyby TO jaroskastore_user;


--
-- Name: SEQUENCE pohyby_id_seq; Type: ACL; Schema: public; Owner: jaroskastore_user
--

GRANT SELECT,USAGE ON SEQUENCE public.pohyby_id_seq TO jaroskastore_user;


--
-- Name: TABLE sklad; Type: ACL; Schema: public; Owner: jaroskastore_user
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sklad TO jaroskastore_user;


--
-- Name: SEQUENCE sklad_id_seq; Type: ACL; Schema: public; Owner: jaroskastore_user
--

GRANT SELECT,USAGE ON SEQUENCE public.sklad_id_seq TO jaroskastore_user;


--
-- jaroskastore_userQL database dump complete
--


