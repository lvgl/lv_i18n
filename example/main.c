#include <stdio.h>
#include "lv_i18n.h"

void use_i18n(void)
{
  printf("%s\t%s\n", "s_en_only", _("s_en_only"));
  printf("%s\t%s\n", "s_translated", _("s_translated"));
  printf("%s\t%s\n", "s_untranslated", _("s_untranslated"));
  printf("%s\t%s\n", "This is a new text", _("This is a new text"));
  for(int i=0; i<10;i++)
    {
      printf("%s\t%d ", "p_i_have_dogs", i);
      printf(_p("p_i_have_dogs", i), i);
      printf("\n");
    }
}

void main(void)
{
  lv_i18n_init(lv_i18n_language_pack);

  lv_i18n_set_locale("en-GB");
  puts("en-GB:");
  use_i18n();
  
  lv_i18n_set_locale("ru-RU");
  puts("ru-RU:");
  use_i18n();
}

