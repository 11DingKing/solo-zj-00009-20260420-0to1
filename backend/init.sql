-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建运动项目表
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL,  -- cardio: 有氧, strength: 力量, flexibility: 柔韧
    unit VARCHAR(20) NOT NULL,       -- km: 公里, reps: 次, sets_reps: 组×次, minutes: 分钟
    is_system BOOLEAN DEFAULT TRUE,
    user_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建周训练计划表
CREATE TABLE IF NOT EXISTS weekly_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建计划日表
CREATE TABLE IF NOT EXISTS plan_days (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,  -- 0: 周一, 1: 周二, ..., 6: 周日
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE,
    UNIQUE(plan_id, day_of_week)
);

-- 创建计划日运动表
CREATE TABLE IF NOT EXISTS plan_day_exercises (
    id SERIAL PRIMARY KEY,
    plan_day_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    target_sets INTEGER,
    target_reps INTEGER,
    target_km NUMERIC(10,2),
    target_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_day_id) REFERENCES plan_days(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- 创建训练记录表
CREATE TABLE IF NOT EXISTS training_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan_day_exercise_id INTEGER,
    exercise_id INTEGER NOT NULL,
    actual_sets INTEGER,
    actual_reps INTEGER,
    actual_km NUMERIC(10,2),
    actual_minutes INTEGER,
    weight NUMERIC(5,2),
    duration_minutes INTEGER,
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_day_exercise_id) REFERENCES plan_day_exercises(id) ON DELETE SET NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id ON weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_days_plan_id ON plan_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_day_exercises_plan_day_id ON plan_day_exercises(plan_day_id);
CREATE INDEX IF NOT EXISTS idx_training_records_user_id ON training_records(user_id);
CREATE INDEX IF NOT EXISTS idx_training_records_recorded_at ON training_records(recorded_at);

-- 预置系统运动项目
INSERT INTO exercises (name, category, unit, is_system) VALUES
-- 有氧运动
('跑步', 'cardio', 'km', TRUE),
('游泳', 'cardio', 'minutes', TRUE),
('骑自行车', 'cardio', 'km', TRUE),
('跳绳', 'cardio', 'minutes', TRUE),
('椭圆机', 'cardio', 'minutes', TRUE),
('划船机', 'cardio', 'minutes', TRUE),
('登山跑', 'cardio', 'minutes', TRUE),
('开合跳', 'cardio', 'minutes', TRUE),

-- 力量训练
('深蹲', 'strength', 'sets_reps', TRUE),
('卧推', 'strength', 'sets_reps', TRUE),
('硬拉', 'strength', 'sets_reps', TRUE),
('引体向上', 'strength', 'sets_reps', TRUE),
('俯卧撑', 'strength', 'sets_reps', TRUE),
('平板支撑', 'strength', 'minutes', TRUE),
('卷腹', 'strength', 'sets_reps', TRUE),
('杠铃划船', 'strength', 'sets_reps', TRUE),
('肩推', 'strength', 'sets_reps', TRUE),
('二头弯举', 'strength', 'sets_reps', TRUE),
('三头下压', 'strength', 'sets_reps', TRUE),
('腿举', 'strength', 'sets_reps', TRUE),
('腿弯举', 'strength', 'sets_reps', TRUE),
('腿屈伸', 'strength', 'sets_reps', TRUE),
('箭步蹲', 'strength', 'sets_reps', TRUE),

-- 柔韧训练
('瑜伽', 'flexibility', 'minutes', TRUE),
('拉伸', 'flexibility', 'minutes', TRUE),
('普拉提', 'flexibility', 'minutes', TRUE),
('太极', 'flexibility', 'minutes', TRUE),
('泡沫轴放松', 'flexibility', 'minutes', TRUE);
