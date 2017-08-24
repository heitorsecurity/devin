using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Variaveis01
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            // Crie 3 variáveis com as idades dos seus melhores amigos
            // e /ou familiares. Algo como:
            // int idadeJoao = 10;
            // int idadeMaria = 25;
            // Em seguida, pegue essas 3 idades e calcule a média delas.
            // Exiba o resultado em um MessageBox.
            int idadeJoao = 10;
            int idadeMaria = 25;
            int mediaIdades = (idadeJoao + idadeMaria) / 2;

            MessageBox.Show(mediaIdades.ToString());
        }

        private void button2_Click(object sender, EventArgs e)
        {
            // Execute o trecho de código a seguir. O que acontece com ele?
            // double pi = 3.14;
            // int piQuebrado = (int)pi;
            // MessageBox.Show("piQuebrado = " + piQuebrado);
            // Repare o (int).Estamos "forçando" a conversão do double
            // para um inteiro. Qual o valor de piQuebrado nesse caso?
            // 3.14, 0 ou 3?
            double pi = 3.14;
            int piQuebrado = (int)pi;
            MessageBox.Show("piQuebrado = " + piQuebrado);
        }

        private void button3_Click(object sender, EventArgs e)
        {
            // (Opcional) No colegial, aprendemos a resolver equações
            // de segundo grau usando a fórmula de Bhaskara. A fórmula é assim:
            // delta = b * b - 4 * a * c;
            // a1 = (-b + raiz(delta)) / (2 * a);
            // a2 = (-b - raiz(delta)) / (2 * a);
            // Crie um programa com três variáveis inteiras, a, b, c,
            // com quaisquer valores.Depois crie 3 variáveis double, delta,
            // a1, a2, com a fórmula anterior.
            // Imprima a1 e a2 em um MessageBox.
            // Dica: Para calcular raiz quadrada, use Math.Sqrt(variavel).
            // Não se esqueça que não podemos calcular a raiz quadrada de
            // números negativos.
            int a = 3;
            int b = 8;
            int c = 2;
            double delta = (b * b) - (4 * a * c);
            double a1 = (-b + Math.Sqrt(delta)) / (2 * a);
            double a2 = (-b - Math.Sqrt(delta)) / (2 * a);

            MessageBox.Show("a1 = " + a1 + " e a2 = " + a2);
        }
    }
}
