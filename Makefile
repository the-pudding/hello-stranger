PHONY: github pudding

github:
	rm -rf docs
	cp -r build docs
	touch docs/.nojekyll
	git add -A
	git commit -m "update github pages"
	git push

protected:
	rm -rf docs
	cp -r build docs
	touch docs/.nojekyll
	npx staticrypt docs/index.html -p $(shell grep PASSWORD .env | cut -d '=' -f2) -d docs
	git add -A
	git commit -m "update github pages"
	git push	

aws-sync:
	aws s3 sync build s3://pudding.cool/2025/06/hello-stranger --delete --cache-control 'max-age=31536000'

aws-cache:
	aws cloudfront create-invalidation --distribution-id E13X38CRR4E04D --paths '/2025/06/hello-stranger*'	

pudding: aws-sync aws-cache