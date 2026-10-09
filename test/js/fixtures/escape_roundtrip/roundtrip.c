#include "check.h"

int main(void)
{
    if(lv_i18n_init_default() != 0) return 1;

    CHECK(_("line1\nline2"), "riga1\nriga2");
    CHECK(_("literal\\ntext"), "letterale\\ntesto");
    CHECK(_("quote \" and slash \\"), "virgolette \" e barra \\");
    CHECK(_("controls\t\r\b\f\a\v\e"), "controlli\t\r\b\f\a\v\033");
    CHECK(_("unicode café 日本語"), "traduzione è 日本語");
    CHECK(_("trigraph \?\?/n"), "traduzione \?\?/n");
    CHECK(_("tokens $& $$ $1 $` $'"), "traduzione $& $$ $1 $` $'");
    CHECK(_("escaped \") terminator"), "virgolette \") conservate");
    CHECK(_p("item\n\"\\", 1), "uno\n\"\\");
    CHECK(_p("item\n\"\\", 2), "molti\n\"\\");
    CHECK(_p("escaped \", comma", 1), "uno \", conservato");
    CHECK(_p("escaped \", comma", 2), "molti \", conservati");

    return failures ? 1 : 0;
}
