-- FULLTEXT 검색 인덱스 추가 (posts 테이블)
-- MySQL 8.0 InnoDB FULLTEXT — ngram 파서로 한글 2글자 이상 검색 지원

ALTER TABLE posts
  ADD FULLTEXT INDEX ft_posts_title   (title)           WITH PARSER ngram,
  ADD FULLTEXT INDEX ft_posts_content (content)         WITH PARSER ngram,
  ADD FULLTEXT INDEX ft_posts_title_content (title, content) WITH PARSER ngram;
