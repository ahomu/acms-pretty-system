/**
 * Davis.js
 */
AcmsAdmin = Davis(function() {

    var $currMain, $container;

    /**
     * when start
     */
    this.bind('start', function() {
        $container = $('#container');
        $currMain = $('#main');
    });

    /**
     * run before all routes
     */
    this.before(function(req) {

    });

    /**
     * 通常のGET遷移
     */
    this.get('.*/bid/:bid/admin/:path/', transitionPage);
    this.get('.*/bid/:bid/cid/:cid/admin/:path/', transitionPage);
    this.get('.*/bid/:bid/uid/:uid/admin/:path/', transitionPage);
    this.get('.*/bid/:bid/tag/:tag/admin/:path/', transitionPage);

    this.get('.*/bid/:bid/eid/:eid/admin/:path/', transferPage);
    this.get('.*/bid/:bid/cid/:cid/eid/:eid/admin/:path/', transferPage);

    this.get(/.*/, function(req) {
        if (!req.isForPageLoad) {
            transferPage(req);
        }
    });

    /**
     * コンフィグ保存時のAjax処理
     */
    this.state('/config/save', function(req) {

        $.ajax({
            type: 'POST',
            url: location.href,
            data: req.params,
            success: function(res) {
                var $main      = $('#main'),
                    $contents  = $main.find('.contents'),
                    $message   = $('<div class="js_message">コンフィグを保存しました</div>');

                $container.get(0).scrollTop = 0;
                $contents.before($message);
                $message.fadeIn('fast', function() {
                    $message.delay(5000).fadeOut(100);
                });
            }
        })
    });

    function transferPage(req) {
        location.href = req.fullPath;
    }

    /**
     * ページ遷移
     *
     * @param req
     */
    function transitionPage(req) {
        if (!!req.isForPageLoad) {
            return;
        }

        // ナビゲーション現在地
        activeNav(req.fullPath);

        $.ajax({
            type: 'GET',
            url: req.fullPath,
            success: function(res) {
                var $main = $('#main', res);

                // mainを取得できた？
                if ($main.html() !== null) {
                    // 取得コンテンツの整形
                    main($main, req.params.path);

                    $currMain.replaceWith($main);
                    $currMain = $main;

                    $container.get(0).scrollTop = 0;

                    // Dispatchを適用
                    ACMS.Dispatch($currMain);

                    // Dispatchされたイベントを修正
                    fixEvent($currMain, req.params.path);
                } else {
                    // 管理ページ外とみなして転送
                    location.href = req.fullPath;
                }
            }
        });
    }
});

/**
 * jQueryいろいろ
 */
jQuery(function() {
    var initPath;

    activeNav(encodeURI(location.pathname)+encodeURI(location.search));

    location.pathname.match(/admin\/(\w+)/);
    initPath = RegExp.$1;

    main($('#main'), initPath);

    fixEvent($('#main'), initPath);

    $('.quickNavSelect').change(function () {
        var url = $(':selected', this).val();
        if ( url !== '' ) {
            location.href = url;
        }
    });

    $('.altSubmit').live('click', function () {
        $(this).prev().click();
    });
});

/**
 * #main の中のコンテンツの初期化整形
 *
 * @param {jQuery} $target
 * @param {String} [path]
 * @return void
 */
function main($target, path) {
    var $temp,
        $topicpath = $target.find('#topicpath'),
        $systembtn = $target.find('.systemBtn'),
        $systemtbl = $systembtn.closest('table'),
        $menugroup = $('<div class="controlMenu" />'),
        $lasttd    = $target.find('.adminTable:not(.adminTableY) tr td:not(.systemBtn):last-child');

    if (0 < $lasttd.size()) {
        // 編集リンクなどにアイコンを付加
        $lasttd.find('a').addClass('button icon edit');
    }

    // submitにbuttonクラスを付加
    $target.find('input[type="submit"]').addClass('button');

    // 冗長タイトルを除去
    $target.find('h1').remove();

    // コントロール用のラッパをトピックパスの後に挿入
    $topicpath.next().after($menugroup);

    // フィルターとショートカットをトピックパスの後に移動
    $menugroup.append($target.find('.filter-toggle-head').addClass('button icon search'));
    $menugroup.append($target.find('.shortcutBtn').addClass('button icon add'));

    // ツールチップアイコンを除去
    $target.find('.tooltipIcon').remove();

    // フィルターボックスを整形
    $target.find('.filter .js-placeholder').after('<br />');

    // フィルターの表示ボタンをaリンクに置換
    $target.find('.filter .button').css('display', 'none').removeClass('button').after('<a href="#" class="button icon search altSubmit">表示</a>');

    // 操作ボタンを作成
    if (1 < $systembtn.size()) {
//        $systembtn.first().closest('table').before('<h2 id="js_sytemBtnGroup">操作メニュー</h2>');
//        $target.prepend('<a id="js_systemBtnTo" href="#js_sytemBtnGroup">操作メニュー</a>');
    }
    else if ( 1 == $systembtn.size() ) {
        $systemtbl.addClass('js_wide');
    }

    // パスがなければここで終了 ===========================================================================================
    if (!path) {
        return;
    }

    // コンフィグ詳細に一覧に戻るリンクを作成
    if (path !== 'config_index' && path.indexOf('config') === 0) {
        if (location.search.indexOf('mid') === -1) {
            $menugroup.prepend('<a class="button icon arrowleft" href="/'+ACMS.Config.offset+'bid/'+ACMS.Config.bid+'/admin/config_index/'+encodeURI(location.search)+'">コンフィグの一覧に戻る</a>');
        } else {
            $menugroup.prepend('<a class="button icon arrowleft" href="/'+ACMS.Config.offset+'bid/'+ACMS.Config.bid+'/admin/module_index/">モジュールIDの一覧に戻る</a>');
        }
    }

    // パスでswitch
    switch(path) {
        case 'config_index':
        case 'import_index':
            $target.find('.indexListItem').each(function() {
                $temp = $(this);
                $temp.find('p').remove();
                $temp.find('a').get(0).innerHTML += $temp.find('img').get(0).alt;
            });

            $target.find('.contents').addClass('configIndex');
            $target.find('.dashboardContents > :first-child, .indexListCategory > :first-child').unwrap();
        break;
        case 'alias_index':
        case 'user_index':
        case 'entry_index':
        case 'category_index':
        case 'comment_index':
        case 'trackback_index':
        case 'module_index':
        case 'rule_index':
        case 'form_index':
        case 'moblog_index':
        case 'schedule_index':
            $temp = $target.find('.titleWrapper').last();

            if ('rule_index' === path || 'module_index' === path) {
                // モジュールIDとルールの一覧で余分なデリミタ表記を除去
                $lasttd.each(function() {
                    this.innerHTML = this.innerHTML.replace('/ ', '');
                });
            }

            $temp.next().find('[type="submit"]').css('display', 'none').removeClass('button').after('<a href="#" class="button icon add altSubmit">新規作成する</a>');
            $temp.next().find('form').prependTo($menugroup).css('display', 'inline');
            $temp.next().remove();

            $temp.remove();
        break;
        case 'alias_edit':
        case 'user_edit':
        case 'category_edit':
        case 'tag_edit':
        case 'module_edit':
        case 'rule_edit':
        case 'form_edit':
        case 'schedule_edit':
        case 'moblog_edit':
            var edit = path.substr(0, path.indexOf('_')),
                title = $target.find('.titleWrapper h2').first().text().replace(/[詳細変更作成]+/, '');

            // (推定) 一覧ボタンを削除
            $target.find('.adminBtn').last().remove();

            // 一覧に戻るリンクを作成
            $menugroup.prepend('<a class="button icon arrowleft" href="/'+ACMS.Config.offset+'bid/'+ACMS.Config.bid+'/admin/'+edit+'_index/">'+title+'の一覧に戻る</a>');
        break;
    }
}

/**
 * ACMS.Dispatchのイベントを修正
 *
 * @param {jQuery} $main
 * @return void
 */
function fixEvent($main, path) {
    var $toggle = $main.find('[class*="-toggle-head"]');

    $toggle.unbind().click(function() {
        if (this.className.match(/(\w+)-toggle-head/) ) {
            $('.'+RegExp.$1+'-toggle-body').fadeToggle(200);
            $toggle.toggleClass('active');
        }
        return false;
    });

    if (location.pathname.indexOf('/order/') !== -1) {
        $toggle.click();
    }

    if (path !== void 0 && path !== 'config_index' && path.indexOf('config') === 0) {
        $main.find('form').bind('submit', function() {
            AcmsAdmin.trans('/config/save', ACMS.Library.getPostData(this));
            return false;
        });
    }
}

/**
 * 現在地をナビゲーションに表現する
 *
 * @param {String} pathAndSearch
 * @return void
 */
function activeNav(pathAndSearch) {
    var $nav    = $('#nav'),
        $anchor = $nav.find('a');

    if (pathAndSearch.indexOf('mid=') !== -1) {
        pathAndSearch = 'module';
    }
    else if (pathAndSearch.indexOf('rid=') !== -1) {
        pathAndSearch = 'rule';
    }
    else if (pathAndSearch.indexOf('entry') !== -1) {
        pathAndSearch = pathAndSearch.indexOf('config') !== -1 ? 'config' : 'entry';
    }
    else {
        pathAndSearch = pathAndSearch.substr(0, pathAndSearch.indexOf('_'));
    }

    if (!pathAndSearch) {
        return;
    }
    $anchor.not('[href*="'+pathAndSearch+'"]').removeClass('js_active');
    $anchor.filter('[href*="'+pathAndSearch+'"]').addClass('js_active');
}
