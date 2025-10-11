-- 이벤트 템플릿 시스템 마이그레이션

-- 1. 이벤트 템플릿 테이블 생성
CREATE TABLE public.event_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR NOT NULL CHECK (type IN ('regular_schedule', 'always_on_server', 'league')),
    game VARCHAR NOT NULL,
    track VARCHAR NOT NULL,
    class VARCHAR NOT NULL,
    time VARCHAR NOT NULL,
    days TEXT[] NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 기존 multis 테이블에 새 컬럼 추가
ALTER TABLE public.multis 
ADD COLUMN template_id UUID REFERENCES public.event_templates(id),
ADD COLUMN event_type VARCHAR NOT NULL DEFAULT 'flash_event' CHECK (event_type IN ('regular_schedule', 'always_on_server', 'league', 'flash_event')),
ADD COLUMN is_template_based BOOLEAN DEFAULT false;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS event_templates_type_idx ON public.event_templates (type);
CREATE INDEX IF NOT EXISTS event_templates_active_idx ON public.event_templates (is_active);
CREATE INDEX IF NOT EXISTS multis_event_type_idx ON public.multis (event_type);
CREATE INDEX IF NOT EXISTS multis_template_id_idx ON public.multis (template_id);

-- 4. 기본 정기 스케줄 템플릿 데이터 삽입
INSERT INTO public.event_templates (type, game, track, class, time, days, description) VALUES
-- 아세토 코르사 정기 스케줄
('regular_schedule', '아세토코르사', 'GTD IMSA', 'GTD', '20:30 ~ 23:00', ARRAY['월', '일'], 'GTD IMSA 갤러리 멀티'),
('regular_schedule', '아세토코르사', '빨딱 갤얼', 'GT3', '20:30 ~ 23:00', ARRAY['화'], '컴페티치오네 빨딱 갤얼'),
('regular_schedule', '아세토코르사', '이니셜 D 고갯길', 'GT3', '20:00 ~ 21:30', ARRAY['수'], '토게 멀티 (토멀)'),
('regular_schedule', '아세토코르사', '갤얼', 'GT3', '20:30 ~ 23:30', ARRAY['목'], '컴페티치오네 갤얼'),

-- 르망 얼티밋 정기 스케줄
('regular_schedule', '르망얼티밋', '초보자 갤멀', 'LMP', '20:00 ~ 23:00', ARRAY['수'], '르망 얼티밋 초보자 갤멀'),
('regular_schedule', '르망얼티밋', '갤멀', 'LMP', '19:30 ~', ARRAY['토'], '르망 얼티밋 갤멀'),
('regular_schedule', '르망얼티밋', '갤멀', 'LMP', '13:00 ~', ARRAY['일'], '르망 얼티밋 갤멀'),

-- F1 25 정기 스케줄
('regular_schedule', 'F1 25', '갤멀', 'F1', '21:30 ~ 23:50', ARRAY['월', '목', '금'], 'F1 25 갤멀'),

-- 기타 정기 스케줄
('regular_schedule', '아이레이싱', '갤멀', 'GT3', '20:00 ~', ARRAY['목'], 'iRacing 갤멀'),
('regular_schedule', '오토모빌리스타2', '갤멀', 'GT3', '20:00 ~', ARRAY['금', '토'], 'Automobilista 2 갤멀');

-- 5. 상시 서버 템플릿 데이터 삽입
INSERT INTO public.event_templates (type, game, track, class, time, days, description) VALUES
('always_on_server', '아세토코르사', 'DC Shutoko 24', 'GT3', '24/7', ARRAY['월', '화', '수', '목', '금', '토', '일'], 'DC Shutoko 24(갤도고)'),
('always_on_server', '아세토코르사', 'DC Touge Rotation 24', 'GT3', '24/7', ARRAY['월', '화', '수', '목', '금', '토', '일'], 'DC Touge Rotation 24'),
('always_on_server', '아세토코르사', 'DC Nordschleife with Traffics', 'GT3', '24/7', ARRAY['월', '화', '수', '목', '금', '토', '일'], 'DC Nordschleife with Traffics'),
('always_on_server', '컴페티치오네', 'DCinside ACC Server', 'GT3', '24/7', ARRAY['월', '화', '수', '목', '금', '토', '일'], 'Dcinside ACC Server'),
('always_on_server', '아세토코르사', 'DC Hakone Turnpike', 'GT3', '24/7', ARRAY['월', '화', '수', '목', '금', '토', '일'], 'DC Hakone Turnpike with traffic'),
('always_on_server', '빔NG', 'DCinside Server', 'GT3', '24/7', ARRAY['월', '화', '수', '목', '금', '토', '일'], 'DCinside Server'),
('always_on_server', '아세토코르사', 'DC LA Canyon', 'GT3', '24/7', ARRAY['월', '화', '수', '목', '금', '토', '일'], 'DC LA Canyon (갤니언)');

-- 6. 리그 템플릿 데이터 삽입
INSERT INTO public.event_templates (type, game, track, class, time, days, description) VALUES
('league', 'EA WRC', 'DCIN WRC LEAGUE', 'WRC', '각 랠리마다 7일씩 운영', ARRAY['월', '화', '수', '목', '금', '토', '일'], 'WRC랠리 리그'),
('league', 'EA WRC', 'DCIN ENDU LEAGUE', 'WRC', '각 랠리마다 7일씩 운영', ARRAY['월', '화', '수', '목', '금', '토', '일'], '랠리 내구 리그(하드코어)'),
('league', 'EA WRC', 'DCIN ENDU LEAGUE', 'WRC', '각 랠리마다 7일씩 운영', ARRAY['월', '화', '수', '목', '금', '토', '일'], '랠리 내구 리그');
