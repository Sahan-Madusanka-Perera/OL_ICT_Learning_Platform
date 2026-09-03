-- Integrity rules that the application must never be able to violate,
-- expressed where they cannot be bypassed by a bug in a service, an
-- admin script, or a future developer writing raw SQL.

--> statement-breakpoint
-- THE trust guarantee (docs/ARCHITECTURE.md §0.1).
-- A question whose answer key has not been verified cannot be published,
-- no matter which code path tries.
ALTER TABLE "questions"
  ADD CONSTRAINT "questions_unverified_never_published"
  CHECK (status <> 'published' OR answer_confidence <> 'unverified');

--> statement-breakpoint
-- A published question must actually teach something.
ALTER TABLE "questions"
  ADD CONSTRAINT "questions_published_needs_explanation"
  CHECK (status <> 'published' OR explanation_md IS NOT NULL);

--> statement-breakpoint
-- A past-paper question must cite the paper it came from, so the
-- "Past Paper · 2023 · P1 Q11" label can never be a claim we cannot back up.
ALTER TABLE "questions"
  ADD CONSTRAINT "questions_past_paper_needs_source"
  CHECK (source_type <> 'past_paper' OR (paper_id IS NOT NULL AND question_number IS NOT NULL));

--> statement-breakpoint
-- Conversely, a model question must NOT masquerade as coming from a paper.
ALTER TABLE "questions"
  ADD CONSTRAINT "questions_model_has_no_paper"
  CHECK (source_type <> 'model' OR paper_id IS NULL);

--> statement-breakpoint
ALTER TABLE "questions"
  ADD CONSTRAINT "questions_marks_positive" CHECK (marks > 0);

--> statement-breakpoint
-- An option is unusable if it has neither text nor a picture.
ALTER TABLE "question_options"
  ADD CONSTRAINT "question_options_has_content"
  CHECK (content_md IS NOT NULL OR asset_id IS NOT NULL);

--> statement-breakpoint
ALTER TABLE "practice_sessions"
  ADD CONSTRAINT "practice_sessions_count_positive" CHECK (question_count > 0);

--> statement-breakpoint
-- Mastery is a probability.
ALTER TABLE "node_mastery"
  ADD CONSTRAINT "node_mastery_range"
  CHECK (mastery >= 0 AND mastery <= 1 AND mastery_lower >= 0 AND mastery_lower <= 1);

--> statement-breakpoint
ALTER TABLE "node_mastery"
  ADD CONSTRAINT "node_mastery_priors_positive" CHECK (alpha > 0 AND beta > 0);

--> statement-breakpoint
ALTER TABLE "question_states"
  ADD CONSTRAINT "question_states_box_range" CHECK (box >= 0 AND box <= 5);

--> statement-breakpoint
ALTER TABLE "question_states"
  ADD CONSTRAINT "question_states_counts_sane"
  CHECK (correct_attempts >= 0 AND correct_attempts <= attempts);

--> statement-breakpoint
-- A syllabus node cannot be its own parent.
ALTER TABLE "syllabus_nodes"
  ADD CONSTRAINT "syllabus_nodes_no_self_parent" CHECK (parent_id IS NULL OR parent_id <> id);

--> statement-breakpoint
ALTER TABLE "exam_papers"
  ADD CONSTRAINT "exam_papers_paper_no_valid" CHECK (paper_no IN (1, 2));

--> statement-breakpoint
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_non_negative" CHECK (amount_cents >= 0);

--> statement-breakpoint
-- A subscription period must move forwards.
ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_period_ordered"
  CHECK (current_period_end > current_period_start);

--> statement-breakpoint
-- Partial index: the "what is due for review" query only ever looks at
-- ungraduated questions, so the index only needs to contain those.
CREATE INDEX "question_states_due_active_idx"
  ON "question_states" ("user_id", "next_review_at")
  WHERE graduated_at IS NULL AND next_review_at IS NOT NULL;

--> statement-breakpoint
-- Partial index: serving questions only ever touches published rows.
CREATE INDEX "questions_published_idx"
  ON "questions" ("syllabus_node_id", "difficulty")
  WHERE status = 'published' AND deleted_at IS NULL;

--> statement-breakpoint
-- Partial index for the admin review queue.
CREATE INDEX "questions_review_queue_idx"
  ON "questions" ("updated_at")
  WHERE status IN ('draft', 'in_review');
