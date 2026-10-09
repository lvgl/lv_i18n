#include "check.h"

int main(void)
{
    if(lv_i18n_init_default() != 0) return 1;

    CHECK(_("double\nquoted"), "double\nline\t\"quoted\"\\tail");
    CHECK(_("single\\nquoted"), "single\\nline \"quoted\" \\tail");
    CHECK(_("plain\\nkey"), "plain\\nline \"quoted\" \\tail");
    CHECK(_("block"), "line one\nline two \\n \"quoted\"\n");
    CHECK(_("folded"), "folded first second \\n \"quoted\"\n");
    CHECK(_("controls"), "bell\a\v\033\0017\037A");
    CHECK(_("trigraph"), "question \?\?/n and \?\?= and \?\?!");
    CHECK(_("tokens"), "tokens $& $$ $1 $` $'");
    CHECK(_p("plurals", 1), "one\n\"item\"");
    CHECK(_p("plurals", 2), "many\n\"items\" \\n");

    return failures ? 1 : 0;
}
