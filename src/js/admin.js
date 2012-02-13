/**
 * Davis.js
 */
AcmsAdmin = Davis(function() {

    this.use(Davis.title);

    var $currMain ;

    /**
     * when start
     */
    this.bind('start', function() {
        $currMain = $('#main');
    });

    /**
     * run before all routes
     */
    this.before(function(req) {

    });

    this.get('/bid/:bid/admin/:path/', function(req) {

        console.log(req, req.fullPath);

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

                    // Dispatchを適用
                    ACMS.Dispatch($currMain);

                    // Dispatchされたイベントを修正
                    fixEvent($currMain);
                } else {
                    // 管理ページ外とみなして転送
                    location.href = req.fullPath;
                }
            }
        });
    });

//    this.get(/.*/, function(req) {
//        location.href = req.path;
//    });

//    this.post(/.*/, function(req) {
//        console.dir(req);
//    });

});

/**
 * jQuery
 */
jQuery(function() {
    var initPath;

    location.pathname.match(/admin\/(\w+)/);
    initPath = RegExp.$1;
    main($('#main'), initPath);
    activeNav(initPath);

    $('.quickNavSelect').change(function () {
        var url = $(':selected', this).val();
        if ( url !== '' ) {
            location.href = url;
        }
    });

    $('.altSubmit').live('click', function () {
        $(this).prev().click();
    });
//    $('.button').click(function() {
//        $(this).closest('form').submit();
//    });
});

/**
 * #main の中のコンテンツの初期化整形
 *
 * @param {jQuery} $target
 * @param {String} [path]
 * @return void
 */
function main($target, path) {
    var $temp, i = 0, iz,
        $topicpath = $target.find('#topicpath'),
        $systembtn = $target.find('.systemBtn'),
        $systemtbl = $systembtn.closest('table'),
        $menugroup = $('<div class="controlMenu" />'),
        $lasttd    = $target.find('.adminTable:not(.adminTableY) tr td:not(.systemBtn):last-child');

    if (0 < $lasttd.size()) {
        // モジュールIDとルールの一覧で余分なデリミタ表記を除去
        $lasttd.html($lasttd.first().html().replace('/ ', ''));
        // 編集リンクなどにアイコンを付加
        $lasttd.find('a').addClass('button icon edit');
    }

    // submitにbuttonクラスを付加
    $target.find('input[type="submit"]').addClass('button');

    // 冗長タイトルを除去
    $target.find('h1').remove();

    // トピックパスをタイトル(トピックパスの次の要素)の後に移動
//    $topicpath.next().after($topicpath);

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

    if (!path) {
        return;
    }

    switch(path) {
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

            if ('entry_index' === path) {
                // "カテゴリ"を消したい！
                var entryAdd = $temp.next().find('form').get(0);

//                while (entryAdd.firstChild.nodeType === 3) {
//                    console.log('hoge');
//                    entryAdd.removeChild(entryAdd.firstChild);
//                }
//                console.log(entryAdd.firstChild.nodeType);
//                $temp.next().find('select').remove();
            }

            $temp.next().find('[type="submit"]').css('display', 'none').removeClass('button').after('<a href="#" class="button icon add altSubmit">新規作成</a>');
            $temp.next().find('form').prependTo($menugroup).css('display', 'inline');
            $temp.next().remove();

            $temp.remove();
        break;
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
    }
}

/**
 * ACMS.Dispatchのイベントを修正
 *
 * @param {jQuery} $main
 * @return void
 */
function fixEvent($main) {
    var $toggle = $main.find('[class*="-toggle-head"]');

    $toggle.unbind().click(function() {
        if (this.className.match(/(\w+)-toggle-head/) ) {
            $('.'+RegExp.$1+'-toggle-body').fadeToggle(200);
        }
        return false;
    });
}

/**
 * 現在地をナビゲーションに表現する
 *
 * @param {String} path
 * @return void
 */
function activeNav(path) {
    var $nav    = $('#nav'),
        $anchor = $nav.find('a');

    if (path.indexOf('mid=') !== -1) {
        path = 'module';
    }
    else if (path.indexOf('rid=') !== -1) {
        path = 'rule';
    }
    else if (path.indexOf('entry') !== -1) {
        path = path.indexOf('edit') !== -1 ? 'entry-edit' : 'entry_index';
    }
    else {
        path = path.substr(0, path.indexOf('_'));
    }

    if (!path) {
        return;
    }
    $anchor.not('[href*="'+path+'"]').removeClass('js_active');
    $anchor.filter('[href*="'+path+'"]').addClass('js_active');
}
