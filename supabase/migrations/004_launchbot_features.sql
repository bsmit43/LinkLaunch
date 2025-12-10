-- LaunchBot Features Migration
-- Adds tables and columns for content syndication, HARO, newsletters, reviews, and social scheduling

-- ============================================
-- NEWSLETTER OUTREACH (enhanced)
-- ============================================

CREATE TABLE IF NOT EXISTS newsletter_outreach (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

    -- Newsletter info
    newsletter_name TEXT NOT NULL,
    newsletter_url TEXT,
    contact_email TEXT,
    subscribers_count INTEGER,

    -- Pitch content
    pitch_subject TEXT,
    pitch_draft TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'no_contact', 'sent', 'follow_up', 'featured', 'declined', 'no_response'
    )),
    is_sponsored BOOLEAN DEFAULT false,

    -- Tracking
    sent_at TIMESTAMPTZ,
    featured_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEW EMAIL QUEUE
-- ============================================

CREATE TABLE IF NOT EXISTS review_email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

    -- Customer info
    customer_email TEXT NOT NULL,
    customer_name TEXT,

    -- Email content
    sequence_step TEXT NOT NULL,
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    platforms TEXT[], -- Array of platform IDs to link to

    -- Scheduling
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,

    -- Status
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'sent', 'clicked', 'failed', 'cancelled'
    )),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REVIEW SUBMISSIONS (track actual reviews)
-- ============================================

CREATE TABLE IF NOT EXISTS review_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,

    -- Platform info
    platform_id TEXT NOT NULL,
    platform_name TEXT NOT NULL,

    -- Review details
    review_url TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    -- Status
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'verified', 'rejected'
    )),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADD ERROR_MESSAGE TO CONTENT_SYNDICATIONS
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'content_syndications' AND column_name = 'error_message'
    ) THEN
        ALTER TABLE content_syndications ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- ============================================
-- ADD SUBREDDIT TO QA_OPPORTUNITIES
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'qa_opportunities' AND column_name = 'subreddit'
    ) THEN
        ALTER TABLE qa_opportunities ADD COLUMN subreddit TEXT;
    END IF;
END $$;

-- ============================================
-- ADD CONTENT_TYPE TO SOCIAL_POSTS
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'social_posts' AND column_name = 'content_type'
    ) THEN
        ALTER TABLE social_posts ADD COLUMN content_type TEXT;
    END IF;
END $$;

-- ============================================
-- ADD PLATFORM_CREDENTIALS TO PROFILES
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'platform_credentials'
    ) THEN
        ALTER TABLE profiles ADD COLUMN platform_credentials JSONB DEFAULT '{}';
    END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_newsletter_outreach_website ON newsletter_outreach(website_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_outreach_status ON newsletter_outreach(status);

CREATE INDEX IF NOT EXISTS idx_review_email_queue_website ON review_email_queue(website_id);
CREATE INDEX IF NOT EXISTS idx_review_email_queue_scheduled ON review_email_queue(scheduled_for) WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_review_submissions_website ON review_submissions(website_id);

CREATE INDEX IF NOT EXISTS idx_content_syndications_status ON content_syndications(status);
CREATE INDEX IF NOT EXISTS idx_content_syndications_website ON content_syndications(website_id);

CREATE INDEX IF NOT EXISTS idx_qa_opportunities_status ON qa_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_qa_opportunities_platform ON qa_opportunities(platform);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE newsletter_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_submissions ENABLE ROW LEVEL SECURITY;

-- Newsletter outreach policies
CREATE POLICY "Users can view own newsletter outreach" ON newsletter_outreach FOR SELECT
    USING (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert newsletter outreach" ON newsletter_outreach FOR INSERT
    WITH CHECK (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own newsletter outreach" ON newsletter_outreach FOR UPDATE
    USING (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));

-- Review email queue policies
CREATE POLICY "Users can view own review emails" ON review_email_queue FOR SELECT
    USING (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert review emails" ON review_email_queue FOR INSERT
    WITH CHECK (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));

-- Review submissions policies
CREATE POLICY "Users can view own review submissions" ON review_submissions FOR SELECT
    USING (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert review submissions" ON review_submissions FOR INSERT
    WITH CHECK (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));

-- Content syndications policies (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'content_syndications' AND policyname = 'Users can view own syndications'
    ) THEN
        CREATE POLICY "Users can view own syndications" ON content_syndications FOR SELECT
            USING (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));
    END IF;
END $$;

-- QA opportunities policies (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'qa_opportunities' AND policyname = 'Users can view own qa opportunities'
    ) THEN
        CREATE POLICY "Users can view own qa opportunities" ON qa_opportunities FOR SELECT
            USING (website_id IN (SELECT id FROM websites WHERE user_id = auth.uid()));
    END IF;
END $$;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_newsletter_outreach_updated_at
    BEFORE UPDATE ON newsletter_outreach
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get opportunity summary for a user
CREATE OR REPLACE FUNCTION get_opportunity_summary(p_user_id UUID)
RETURNS TABLE (
    haro_pending BIGINT,
    newsletter_pending BIGINT,
    community_pending BIGINT,
    social_scheduled BIGINT,
    syndication_pending BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM haro_pitches hp
         JOIN websites w ON hp.website_id = w.id
         WHERE w.user_id = p_user_id AND hp.status = 'pending_review'),
        (SELECT COUNT(*) FROM newsletter_outreach no
         JOIN websites w ON no.website_id = w.id
         WHERE w.user_id = p_user_id AND no.status = 'draft'),
        (SELECT COUNT(*) FROM qa_opportunities qo
         JOIN websites w ON qo.website_id = w.id
         WHERE w.user_id = p_user_id AND qo.status = 'pending_review'),
        (SELECT COUNT(*) FROM social_posts sp
         WHERE sp.user_id = p_user_id AND sp.status = 'scheduled'),
        (SELECT COUNT(*) FROM content_syndications cs
         JOIN websites w ON cs.website_id = w.id
         WHERE w.user_id = p_user_id AND cs.status = 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
