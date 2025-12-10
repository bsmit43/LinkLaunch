-- LinkLaunch Database Schema
-- Comprehensive schema for automated traffic generation platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES & SUBSCRIPTIONS
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,

    -- Subscription
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'liftoff', 'orbit', 'galaxy')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,

    -- Limits
    monthly_submissions_limit INTEGER DEFAULT 5,
    monthly_submissions_used INTEGER DEFAULT 0,
    limits_reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),

    -- Settings
    email_notifications BOOLEAN DEFAULT true,
    weekly_report BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEBSITES (Products to promote)
-- ============================================

CREATE TABLE websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Basic info
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    tagline TEXT,
    description_short TEXT, -- 160 chars
    description_medium TEXT, -- 500 chars
    description_long TEXT, -- 1000+ chars

    -- Business info
    industry TEXT,
    category TEXT,
    business_type TEXT CHECK (business_type IN ('b2b', 'b2c', 'b2b2c', 'marketplace', 'saas', 'ecommerce', 'service', 'content')),
    target_audience TEXT,
    keywords TEXT[], -- Array of keywords

    -- Assets
    logo_url TEXT,
    screenshot_url TEXT,
    video_url TEXT,

    -- Social links
    twitter_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    producthunt_url TEXT,

    -- Contact
    contact_email TEXT,
    founder_name TEXT,
    founder_email TEXT,
    founder_title TEXT,

    -- Competitors (for backlink stealing)
    competitors TEXT[], -- Array of competitor URLs

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    onboarding_completed BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DIRECTORIES (Master list)
-- ============================================

CREATE TABLE directories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic info
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,

    -- Categorization
    type TEXT NOT NULL CHECK (type IN ('directory', 'social', 'content', 'review', 'news', 'podcast', 'award', 'press')),
    categories TEXT[], -- What categories this directory covers
    industries TEXT[], -- What industries this directory serves
    business_types TEXT[], -- B2B, B2C, etc.

    -- Quality metrics
    domain_authority INTEGER, -- Moz DA
    monthly_traffic INTEGER, -- Estimated monthly visitors
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'elite')), -- Matches subscription tiers

    -- Submission info
    submission_type TEXT NOT NULL CHECK (submission_type IN ('api', 'form', 'email', 'manual')),
    submission_url TEXT,
    requires_account BOOLEAN DEFAULT false,
    is_free BOOLEAN DEFAULT true,
    listing_fee DECIMAL(10,2),

    -- Timing
    review_time_days INTEGER, -- Estimated days for review
    approval_rate DECIMAL(3,2), -- 0.00 to 1.00

    -- Technical
    adapter_name TEXT, -- Which adapter to use for submission
    adapter_config JSONB, -- Configuration for the adapter

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBMISSIONS (Directory submissions)
-- ============================================

CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    directory_id UUID NOT NULL REFERENCES directories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'queued', 'in_progress', 'submitted',
        'approved', 'rejected', 'needs_review', 'failed', 'expired'
    )),

    -- Submission details
    submitted_at TIMESTAMPTZ,
    listing_url TEXT, -- URL of approved listing

    -- Content used
    title_used TEXT,
    description_used TEXT,

    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,

    -- Tracking
    screenshot_url TEXT, -- Screenshot of submission
    confirmation_email TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(website_id, directory_id)
);

-- ============================================
-- GENERATED CONTENT (AI-generated content)
-- ============================================

CREATE TABLE generated_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

    -- Content type
    content_type TEXT NOT NULL CHECK (content_type IN (
        'description_short', 'description_medium', 'description_long',
        'twitter_post', 'linkedin_post', 'reddit_post',
        'blog_article', 'press_release', 'pitch_email',
        'haro_response', 'podcast_pitch', 'guest_post_pitch'
    )),

    -- Target (optional, for platform-specific content)
    target_platform TEXT,
    target_directory_id UUID REFERENCES directories(id),

    -- Content
    content TEXT NOT NULL,

    -- Metadata
    word_count INTEGER,
    character_count INTEGER,
    ai_model TEXT DEFAULT 'gemini-pro',
    prompt_used TEXT,

    -- Usage
    is_approved BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL POSTS (Scheduled social media)
-- ============================================

CREATE TABLE social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Platform
    platform TEXT NOT NULL CHECK (platform IN (
        'twitter', 'linkedin', 'reddit', 'facebook',
        'instagram', 'producthunt', 'indiehackers', 'hackernews'
    )),

    -- Content
    content TEXT NOT NULL,
    media_urls TEXT[], -- Images/videos
    link_url TEXT,

    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    posted_at TIMESTAMPTZ,

    -- Status
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'draft', 'scheduled', 'posting', 'posted', 'failed', 'canceled'
    )),

    -- Results
    post_url TEXT, -- Link to the posted content
    engagement_data JSONB, -- Likes, comments, shares, etc.

    -- Error handling
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTENT SYNDICATION (Blog reposts)
-- ============================================

CREATE TABLE content_syndications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Original content
    original_title TEXT NOT NULL,
    original_url TEXT NOT NULL,
    original_content TEXT NOT NULL,

    -- Target platform
    platform TEXT NOT NULL CHECK (platform IN (
        'medium', 'devto', 'hashnode', 'linkedin_article',
        'substack', 'blogger', 'quora_space', 'reddit'
    )),

    -- Syndicated content (rewritten)
    syndicated_title TEXT,
    syndicated_content TEXT,
    canonical_url TEXT, -- Points back to original

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'rewriting', 'scheduled', 'published', 'failed'
    )),

    -- Results
    published_url TEXT,
    published_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QA MONITORING (Question & Answer tracking)
-- ============================================

CREATE TABLE qa_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

    -- Source
    platform TEXT NOT NULL CHECK (platform IN (
        'quora', 'reddit', 'stackoverflow', 'twitter',
        'indiehackers', 'producthunt', 'facebook_group', 'discord'
    )),
    question_url TEXT NOT NULL UNIQUE,
    question_title TEXT NOT NULL,
    question_content TEXT,

    -- Analysis
    relevance_score DECIMAL(3,2), -- 0.00 to 1.00
    keywords_matched TEXT[],

    -- Response
    status TEXT NOT NULL DEFAULT 'found' CHECK (status IN (
        'found', 'generating', 'pending_review', 'approved',
        'posted', 'skipped', 'failed'
    )),
    generated_answer TEXT,
    posted_answer TEXT,
    answer_url TEXT,

    -- Metadata
    found_at TIMESTAMPTZ DEFAULT NOW(),
    posted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HARO & JOURNALIST OUTREACH
-- ============================================

CREATE TABLE haro_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Query details
    source TEXT NOT NULL CHECK (source IN ('haro', 'qwoted', 'sourcebottle', 'terkel', 'featured', 'twitter')),
    query_id TEXT, -- External ID if available
    journalist_name TEXT,
    journalist_email TEXT,
    publication TEXT,

    -- Content
    query_title TEXT NOT NULL,
    query_content TEXT NOT NULL,
    deadline TIMESTAMPTZ,

    -- Categorization
    categories TEXT[],
    keywords TEXT[],

    -- Status
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'matched', 'pitched', 'published', 'expired', 'skipped')),

    received_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE haro_pitches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES haro_queries(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Pitch content
    pitch_content TEXT NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_review', 'approved', 'sent',
        'responded', 'published', 'rejected'
    )),

    -- Results
    sent_at TIMESTAMPTZ,
    published_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PODCAST OUTREACH
-- ============================================

CREATE TABLE podcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    website_url TEXT,
    rss_feed_url TEXT,

    -- Host info
    host_name TEXT,
    host_email TEXT,
    host_twitter TEXT,
    host_linkedin TEXT,

    -- Metrics
    estimated_listeners INTEGER,
    episode_count INTEGER,
    accepts_guests BOOLEAN DEFAULT true,

    -- Categorization
    categories TEXT[],
    industries TEXT[],

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE podcast_pitches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Pitch
    pitch_content TEXT NOT NULL,
    talking_points TEXT[],

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'follow_up_1', 'follow_up_2',
        'responded', 'scheduled', 'recorded', 'published', 'declined'
    )),

    -- Outreach tracking
    emails_sent INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    next_follow_up_at TIMESTAMPTZ,

    -- Results
    episode_url TEXT,
    air_date TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEW MANAGEMENT
-- ============================================

CREATE TABLE review_platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('saas', 'local', 'general')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE review_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    platform_id UUID NOT NULL REFERENCES review_platforms(id) ON DELETE CASCADE,

    -- Customer info (optional)
    customer_email TEXT,
    customer_name TEXT,

    -- Request
    request_url TEXT, -- Unique review request link
    sent_at TIMESTAMPTZ,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'sent', 'clicked', 'submitted', 'verified'
    )),

    -- Result
    review_url TEXT,
    rating INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BACKLINK TRACKING & COMPETITOR ANALYSIS
-- ============================================

CREATE TABLE backlinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

    -- Source
    source_url TEXT NOT NULL,
    source_domain TEXT NOT NULL,
    source_domain_authority INTEGER,

    -- Target
    target_url TEXT NOT NULL,
    anchor_text TEXT,

    -- Type
    link_type TEXT CHECK (link_type IN ('dofollow', 'nofollow', 'ugc', 'sponsored')),
    context TEXT, -- Where on the page the link appears

    -- Discovery
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    is_from_submission BOOLEAN DEFAULT false,
    submission_id UUID REFERENCES submissions(id),

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_checked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE competitor_backlinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    competitor_url TEXT NOT NULL,

    -- Backlink info
    source_url TEXT NOT NULL,
    source_domain TEXT NOT NULL,
    source_domain_authority INTEGER,

    -- Opportunity
    is_replicable BOOLEAN DEFAULT false,
    opportunity_type TEXT CHECK (opportunity_type IN ('directory', 'guest_post', 'resource_page', 'broken_link', 'other')),
    outreach_status TEXT DEFAULT 'new' CHECK (outreach_status IN ('new', 'contacted', 'acquired', 'rejected', 'skipped')),

    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OUTREACH CAMPAIGNS
-- ============================================

CREATE TABLE outreach_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Campaign info
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'guest_post', 'resource_page', 'broken_link',
        'skyscraper', 'podcast', 'influencer'
    )),

    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),

    -- Stats
    total_prospects INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    responses_received INTEGER DEFAULT 0,
    links_acquired INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE outreach_prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,

    -- Prospect info
    website_url TEXT NOT NULL,
    contact_email TEXT,
    contact_name TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
        'new', 'email_1', 'email_2', 'email_3',
        'responded', 'link_acquired', 'declined', 'bounced'
    )),

    -- Tracking
    emails_sent INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    next_send_at TIMESTAMPTZ,

    -- Results
    response_content TEXT,
    link_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AWARDS & PRESS
-- ============================================

CREATE TABLE awards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    organization TEXT,
    url TEXT NOT NULL,

    -- Details
    description TEXT,
    categories TEXT[],
    industries TEXT[],

    -- Deadlines
    deadline TIMESTAMPTZ,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT, -- 'annual', 'quarterly', etc.

    -- Requirements
    requirements TEXT,
    fee DECIMAL(10,2),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE award_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'submitted', 'shortlisted', 'won', 'lost'
    )),

    submitted_at TIMESTAMPTZ,
    result_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS & REPORTING
-- ============================================

CREATE TABLE daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Submission stats
    submissions_sent INTEGER DEFAULT 0,
    submissions_approved INTEGER DEFAULT 0,
    submissions_rejected INTEGER DEFAULT 0,

    -- Backlink stats
    new_backlinks INTEGER DEFAULT 0,
    lost_backlinks INTEGER DEFAULT 0,
    total_backlinks INTEGER DEFAULT 0,

    -- Social stats
    social_posts_sent INTEGER DEFAULT 0,
    social_engagement INTEGER DEFAULT 0,

    -- Traffic stats (if integrated)
    referral_visits INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(website_id, date)
);

-- ============================================
-- JOB QUEUE (for worker processes)
-- ============================================

CREATE TABLE job_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Job info
    job_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    priority INTEGER DEFAULT 0,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'dead'
    )),

    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Error handling
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,

    -- Metadata
    worker_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- Websites
CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_websites_status ON websites(status);
CREATE INDEX idx_websites_industry ON websites USING GIN(keywords);

-- Directories
CREATE INDEX idx_directories_type ON directories(type);
CREATE INDEX idx_directories_tier ON directories(tier);
CREATE INDEX idx_directories_categories ON directories USING GIN(categories);
CREATE INDEX idx_directories_industries ON directories USING GIN(industries);

-- Submissions
CREATE INDEX idx_submissions_website_id ON submissions(website_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);

-- Social posts
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_social_posts_website ON social_posts(website_id);

-- Job queue
CREATE INDEX idx_job_queue_status ON job_queue(status, scheduled_for);
CREATE INDEX idx_job_queue_type ON job_queue(job_type);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_syndications ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE haro_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Websites policies
CREATE POLICY "Users can view own websites" ON websites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own websites" ON websites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own websites" ON websites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own websites" ON websites FOR DELETE USING (auth.uid() = user_id);

-- Submissions policies
CREATE POLICY "Users can view own submissions" ON submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Directories are public read
CREATE POLICY "Anyone can view directories" ON directories FOR SELECT USING (true);

-- Generated content policies
CREATE POLICY "Users can view own content" ON generated_content FOR SELECT
    USING (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));

-- Social posts policies
CREATE POLICY "Users can manage own posts" ON social_posts FOR ALL USING (auth.uid() = user_id);

-- Backlinks policies
CREATE POLICY "Users can view own backlinks" ON backlinks FOR SELECT
    USING (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));

-- Daily stats policies
CREATE POLICY "Users can view own stats" ON daily_stats FOR SELECT
    USING (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Reset monthly limits
CREATE OR REPLACE FUNCTION reset_monthly_limits()
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET
        monthly_submissions_used = 0,
        limits_reset_at = date_trunc('month', NOW()) + INTERVAL '1 month'
    WHERE limits_reset_at <= NOW();
END;
$$ LANGUAGE plpgsql;
