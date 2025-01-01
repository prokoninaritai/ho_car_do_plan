# アセットのプリコンパイル対象を指定
Rails.application.config.assets.precompile += %w(application.css application.js)

# 必要な追加ファイルをプリコンパイル
Rails.application.config.assets.precompile += %w(custom_styles.css bootstrap.css)